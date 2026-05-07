import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PointRedemption, PointRedemptionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SapService } from '../sap/sap.service';
import { CreatePointRedemptionDto } from './dto/create-point-redemption.dto';
import { PointRedemptionResponseDto } from './dto/point-redemption-response.dto';

@Injectable()
export class PointRedemptionsService {
  private readonly logger = new Logger(PointRedemptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sapService: SapService,
  ) {}

  async create(
    dto: CreatePointRedemptionDto,
    requestedByUserId?: string,
  ): Promise<PointRedemptionResponseDto> {
    const input = this.normalizeRequest(dto);
    //console.log({input})
    if (input.pointsUsed <= 0) {
      throw new BadRequestException('points Used must be greater than zero');
    }

    const existing = await this.prisma.pointRedemption.findUnique({
      where: {
        channel_orderId: {
          channel: input.channel || 'ECOMMERCE',
          orderId: input.orderId,
        },
      },
    });
    //console.log({existing})
    if (existing) {
      return this.handleExistingRedemption(existing, input);
    }

    const pending = await this.prisma.pointRedemption.create({
      data: {
        orderId: input.orderId,
        channel: input.channel || 'ECOMMERCE',
        storeCode: input.storeCode,
        documentNumber: input.documentNumber,
        cardNumber: input.cardNumber,
        customerName: input.customerName,
        purchaseAmount: new Prisma.Decimal(input.purchaseAmount),
        pointsUsed: new Prisma.Decimal(input.pointsUsed),
        currency: input.currency || 'USD',
        transactionAt: new Date(input.transactionAt),
        notes: input.notes,
        status: PointRedemptionStatus.PENDING,
        requestPayload: this.toJsonValue(input),
        requestedByUserId,
      },
    });

    try {
      const sapRequest = this.buildSapRequest(input);
      const sapResponse = await this.sapService.redeemPoints(sapRequest,"-");

      if (!sapResponse.success) {
        const rejected = await this.prisma.pointRedemption.update({
          where: { id: pending.id },
          data: {
            status: PointRedemptionStatus.REJECTED,
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

      const processed = await this.prisma.pointRedemption.update({
        where: { id: pending.id },
        data: {
          status: PointRedemptionStatus.PROCESSED,
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
        `Point redemption processed for channel=${processed.channel} orderId=${processed.orderId}`,
      );
      return this.toResponseDto(processed, sapResponse.message);
    } catch (error) {
      await this.prisma.pointRedemption.update({
        where: { id: pending.id },
        data: {
          status: PointRedemptionStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private normalizeRequest(dto: CreatePointRedemptionDto): CreatePointRedemptionDto {
    return {
      ...dto,
      orderId: dto.orderId.trim(),
      cardNumber: dto.cardNumber.trim(),
      documentNumber: dto.documentNumber.trim(),
      customerName: dto.customerName?.trim(),
      currency: dto.currency?.trim().toUpperCase() || 'USD',
      channel: dto.channel?.trim().toUpperCase() || 'ECOMMERCE',
      storeCode: dto.storeCode?.trim().toUpperCase(),
      transactionAt: new Date(dto.transactionAt).toISOString(),
      notes: dto.notes?.trim(),
    };
  }

  private async handleExistingRedemption(
    existing: PointRedemption,
    input: CreatePointRedemptionDto,
  ): Promise<PointRedemptionResponseDto> {
    if (!this.matchesExistingRequest(existing, input)) {
      throw new ConflictException(
        `A point redemption already exists for channel=${input.channel} and orderId=${input.orderId} with a different payload`,
      );
    }

    if (existing.status === PointRedemptionStatus.PROCESSED) {
      return this.toResponseDto(
        existing,
        existing.sapMessage || 'Point redemption already processed',
      );
    }

    if (existing.status === PointRedemptionStatus.REJECTED) {
      return this.toResponseDto(existing, existing.sapMessage || 'Point redemption was rejected');
    }

    if (existing.status === PointRedemptionStatus.PENDING) {
      throw new ConflictException(
        `A point redemption for channel=${input.channel} and orderId=${input.orderId} is already being processed`,
      );
    }

    throw new ConflictException(
      `A failed point redemption already exists for channel=${input.channel} and orderId=${input.orderId}`,
    );
  }

  private matchesExistingRequest(
    existing: PointRedemption,
    input: CreatePointRedemptionDto,
  ): boolean {
    return (
      existing.documentNumber === input.documentNumber &&
      existing.cardNumber === input.cardNumber &&
      existing.purchaseAmount.equals(new Prisma.Decimal(input.purchaseAmount)) &&
      existing.pointsUsed.equals(new Prisma.Decimal(input.pointsUsed)) &&
      existing.currency === input.currency &&
      existing.storeCode === (input.storeCode ?? null)
    );
  }

  private buildSapRequest(input: CreatePointRedemptionDto) {
    return {
      orderId: input.orderId,
      cardNumber: input.cardNumber,
      documentNumber: input.documentNumber,
      customerName: input.customerName,
      purchaseAmount: input.purchaseAmount,
      pointsUsed: input.pointsUsed,
      currency: input.currency || 'USD',
      channel: input.channel || 'ECOMMERCE',
      storeCode: input.storeCode,
      transactionAt: input.transactionAt,
      notes: input.notes,
    };
  }

  private toResponseDto(
    entity: PointRedemption,
    fallbackMessage: string,
  ): PointRedemptionResponseDto {
    return {
      redemptionId: entity.id,
      orderId: entity.orderId,
      channel: entity.channel,
      status: entity.status,
      documentNumber: entity.documentNumber,
      cardNumber: entity.cardNumber,
      purchaseAmount: Number(entity.purchaseAmount),
      pointsUsed: Number(entity.pointsUsed),
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
