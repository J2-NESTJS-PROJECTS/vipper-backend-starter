import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PointRedemption,
  PointRedemptionStatus,
  PointRefund,
  PointRefundStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SapService } from '../sap/sap.service';
import { CreatePointRefundDto } from './dto/create-point-refund.dto';
import { PointRefundResponseDto } from './dto/point-refund-response.dto';

@Injectable()
export class PointRefundsService {
  private readonly logger = new Logger(PointRefundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sapService: SapService,
  ) {}

  async create(
    dto: CreatePointRefundDto,
    requestedByUserId?: string,
  ): Promise<PointRefundResponseDto> {
    const input = this.normalizeRequest(dto);

    if (input.pointsRefunded <= 0) {
      throw new BadRequestException('pointsRefunded must be greater than zero');
    }

    const existing = await this.prisma.pointRefund.findUnique({
      where: {
        channel_refundId: {
          channel: input.channel || 'ECOMMERCE',
          refundId: input.refundId,
        },
      },
    });

    if (existing) {
      return this.handleExistingRefund(existing, input);
    }

    const originalRedemption = await this.getOriginalRedemptionOrThrow(input);
    this.ensureOriginalRedemptionMatches(originalRedemption, input);
    await this.ensureRefundDoesNotExceedOriginalPoints(originalRedemption, input);

    const pending = await this.prisma.pointRefund.create({
      data: {
        refundId: input.refundId,
        channel: input.channel || 'ECOMMERCE',
        originalOrderId: input.originalOrderId,
        pointRedemptionId: originalRedemption.id,
        documentNumber: input.documentNumber,
        cardNumber: input.cardNumber,
        customerName: input.customerName,
        refundAmount: new Prisma.Decimal(input.refundAmount),
        pointsRefunded: new Prisma.Decimal(input.pointsRefunded),
        currency: input.currency || 'USD',
        transactionAt: new Date(input.transactionAt),
        reason: input.reason,
        notes: input.notes,
        status: PointRefundStatus.PENDING,
        requestPayload: this.toJsonValue(input),
        requestedByUserId,
      },
    });

    try {
      const sapRequest = this.buildSapRequest(input);
      const sapResponse = await this.sapService.refundPoints(sapRequest,"+");

      if (!sapResponse.success) {
        const rejected = await this.prisma.pointRefund.update({
          where: { id: pending.id },
          data: {
            status: PointRefundStatus.REJECTED,
            sapReference: sapResponse.sapReference ?? null,
            sapMessage: sapResponse.message,
            remainingPoints:
              sapResponse.remainingPoints != null
                ? new Prisma.Decimal(sapResponse.remainingPoints)
                : undefined,
            sapRequestPayload: this.toJsonValue(sapRequest),
            sapResponsePayload: this.toJsonValue(sapResponse.raw ?? sapResponse),
            rejectedAt: new Date(),
          },
        });

        return this.toResponseDto(rejected, sapResponse.message);
      }

      const processed = await this.prisma.pointRefund.update({
        where: { id: pending.id },
        data: {
          status: PointRefundStatus.PROCESSED,
          sapReference: sapResponse.sapReference ?? null,
          sapMessage: sapResponse.message,
          remainingPoints:
            sapResponse.remainingPoints != null
              ? new Prisma.Decimal(sapResponse.remainingPoints)
              : undefined,
          sapRequestPayload: this.toJsonValue(sapRequest),
          sapResponsePayload: this.toJsonValue(sapResponse.raw ?? sapResponse),
          processedAt: new Date(),
        },
      });

      this.logger.log(
        `Point refund processed for channel=${processed.channel} refundId=${processed.refundId}`,
      );
      return this.toResponseDto(processed, sapResponse.message);
    } catch (error) {
      await this.prisma.pointRefund.update({
        where: { id: pending.id },
        data: {
          status: PointRefundStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private normalizeRequest(dto: CreatePointRefundDto): CreatePointRefundDto {
    return {
      ...dto,
      refundId: dto.refundId.trim(),
      originalOrderId: dto.originalOrderId.trim(),
      cardNumber: dto.cardNumber.trim(),
      documentNumber: dto.documentNumber.trim(),
      customerName: dto.customerName?.trim(),
      currency: dto.currency?.trim().toUpperCase() || 'USD',
      channel: dto.channel?.trim().toUpperCase() || 'ECOMMERCE',
      storeCode: dto.storeCode?.trim().toUpperCase(),
      transactionAt: new Date(dto.transactionAt).toISOString(),
      reason: dto.reason?.trim(),
      notes: dto.notes?.trim(),
    };
  }

  private async getOriginalRedemptionOrThrow(
    input: CreatePointRefundDto,
  ): Promise<PointRedemption> {
    const original = await this.prisma.pointRedemption.findUnique({
      where: {
        channel_orderId: {
          channel: input.channel || 'ECOMMERCE',
          orderId: input.originalOrderId,
        },
      },
    });

    if (!original) {
      throw new NotFoundException(
        `Original point redemption not found for channel=${input.channel} and orderId=${input.originalOrderId}`,
      );
    }

    if (original.status !== PointRedemptionStatus.PROCESSED) {
      throw new ConflictException(
        `Original point redemption for channel=${input.channel} and orderId=${input.originalOrderId} is not processed`,
      );
    }

    return original;
  }

  private ensureOriginalRedemptionMatches(
    original: PointRedemption,
    input: CreatePointRefundDto,
  ): void {
    if (original.documentNumber !== input.documentNumber) {
      throw new ConflictException('documentNumber does not match the original point redemption');
    }

    if (original.cardNumber !== input.cardNumber) {
      throw new ConflictException('cardNumber does not match the original point redemption');
    }

    if (original.currency !== input.currency) {
      throw new ConflictException('currency does not match the original point redemption');
    }
  }

  private async ensureRefundDoesNotExceedOriginalPoints(
    original: PointRedemption,
    input: CreatePointRefundDto,
  ): Promise<void> {
    const aggregate = await this.prisma.pointRefund.aggregate({
      where: {
        pointRedemptionId: original.id,
        status: PointRefundStatus.PROCESSED,
      },
      _sum: {
        pointsRefunded: true,
      },
    });

    const alreadyRefunded = aggregate._sum.pointsRefunded ?? new Prisma.Decimal(0);
    const requestedRefund = new Prisma.Decimal(input.pointsRefunded);
    const totalRefunded = alreadyRefunded.plus(requestedRefund);

    if (totalRefunded.greaterThan(original.pointsUsed)) {
      throw new ConflictException('The requested refund exceeds the points used in the original redemption');
    }
  }

  private async handleExistingRefund(
    existing: PointRefund,
    input: CreatePointRefundDto,
  ): Promise<PointRefundResponseDto> {
    if (!this.matchesExistingRefundRequest(existing, input)) {
      throw new ConflictException(
        `A point refund already exists for channel=${input.channel} and refundId=${input.refundId} with a different payload`,
      );
    }

    if (existing.status === PointRefundStatus.PROCESSED) {
      return this.toResponseDto(existing, existing.sapMessage || 'Point refund already processed');
    }

    if (existing.status === PointRefundStatus.REJECTED) {
      return this.toResponseDto(existing, existing.sapMessage || 'Point refund was rejected');
    }

    if (existing.status === PointRefundStatus.PENDING) {
      throw new ConflictException(
        `A point refund for channel=${input.channel} and refundId=${input.refundId} is already being processed`,
      );
    }

    throw new ConflictException(
      `A failed point refund already exists for channel=${input.channel} and refundId=${input.refundId}`,
    );
  }

  private matchesExistingRefundRequest(
    existing: PointRefund,
    input: CreatePointRefundDto,
  ): boolean {
    return (
      existing.originalOrderId === input.originalOrderId &&
      existing.documentNumber === input.documentNumber &&
      existing.cardNumber === input.cardNumber &&
      existing.refundAmount.equals(new Prisma.Decimal(input.refundAmount)) &&
      existing.pointsRefunded.equals(new Prisma.Decimal(input.pointsRefunded)) &&
      existing.currency === input.currency &&
      existing.storeCode === (input.storeCode ?? null)
    );
  }

  private buildSapRequest(input: CreatePointRefundDto) {
    return {
      refundId: input.refundId,
      originalOrderId: input.originalOrderId,
      cardNumber: input.cardNumber,
      documentNumber: input.documentNumber,
      customerName: input.customerName,
      refundAmount: input.refundAmount,
      pointsRefunded: input.pointsRefunded,
      currency: input.currency || 'USD',
      channel: input.channel || 'ECOMMERCE',
      storeCode: input.storeCode,
      transactionAt: input.transactionAt,
      reason: input.reason,
      notes: input.notes,
    };
  }

  private toResponseDto(
    entity: PointRefund,
    fallbackMessage: string,
  ): PointRefundResponseDto {
    return {
      refundRecordId: entity.id,
      refundId: entity.refundId,
      originalOrderId: entity.originalOrderId,
      channel: entity.channel,
      status: entity.status,
      documentNumber: entity.documentNumber,
      cardNumber: entity.cardNumber,
      refundAmount: Number(entity.refundAmount),
      pointsRefunded: Number(entity.pointsRefunded),
      remainingPoints: entity.remainingPoints != null ? Number(entity.remainingPoints) : null,
      sapReference: entity.sapReference,
      sapMessage: entity.sapMessage,
      processedAt: entity.processedAt?.toISOString() ?? null,
      message: entity.sapMessage || fallbackMessage,
    };
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}
