import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../sap/sap.service';
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
