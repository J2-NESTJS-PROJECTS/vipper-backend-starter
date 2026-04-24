import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SapService } from '../sap/sap.service';
import { GenerateMonthlyConsumptionDto } from './dto/generate-monthly-consumption.dto';
import { MonthlyConsumptionResponseDto } from './dto/monthly-consumption-response.dto';
import { StatementsQueryDto } from './dto/statements-query.dto';
import { StatementResponseDto } from './dto/statement-response.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class StatementsService {
  private readonly logger = new Logger(StatementsService.name);

  constructor(private readonly sapService: SapService) {}

  async findAll(
    query: StatementsQueryDto,
  ): Promise<PaginatedResponseDto<StatementResponseDto>> {
    const { page = 1, limit = 20, customerId, cardId, year, month } = query;

    this.logger.debug(`Fetching statements from SAP with filters: ${JSON.stringify(query)}`);

    const { statements, total } = await this.sapService.getStatements(
      { customerId, cardId, year, month },
      page,
      limit,
    );

    const mapped = statements.map((s) => this.mapToDto(s));
    return new PaginatedResponseDto(mapped, total, page, limit);
  }

  async getMonthlyConsumption(
    request: GenerateMonthlyConsumptionDto,
  ): Promise<MonthlyConsumptionResponseDto> {
    const hasCustomerId = Boolean(request.customerId);
    const hasCardId = Boolean(request.cardId);

    if (hasCustomerId === hasCardId) {
      throw new BadRequestException('Send exactly one of customerId or cardId');
    }

    const cutoffDate = new Date(`${request.cutoffDate}T00:00:00`);
    if (
      Number.isNaN(cutoffDate.getTime()) ||
      cutoffDate.getUTCFullYear() !== request.year ||
      cutoffDate.getUTCMonth() + 1 !== request.month
    ) {
      throw new BadRequestException('cutoffDate must belong to the requested year and month');
    }

    this.logger.debug(`Fetching monthly consumption report from SAP: ${JSON.stringify(request)}`);

    const report = await this.sapService.getMonthlyConsumptionReport({
      customerId: request.customerId,
      cardId: request.cardId,
      cutoffDate: request.cutoffDate,
    });

    if (
      !report.header?.customerCode &&
      !report.header?.cardNumber &&
      !report.header?.identification
    ) {
      throw new NotFoundException('Monthly consumption report not found in SAP');
    }

    return {
      year: request.year,
      month: request.month,
      cutoffDate: request.cutoffDate,
      header: report.header,
      consumptions: report.consumptions,
    };
  }

  private mapToDto(s: any): StatementResponseDto {
    return {
      id: s.id,
      cardId: s.cardId,
      customerId: s.customerId,
      period: s.period,
      year: s.year,
      month: s.month,
      openingBalance: s.openingBalance,
      closingBalance: s.closingBalance,
      totalCharges: s.totalCharges,
      totalPayments: s.totalPayments,
      minimumPayment: s.minimumPayment,
      dueDate: s.dueDate,
      currency: s.currency,
      status: s.status,
    };
  }
}
