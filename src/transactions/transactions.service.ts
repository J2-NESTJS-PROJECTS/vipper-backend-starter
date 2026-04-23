import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../sap/sap.service';
import { TransactionsQueryDto } from './dto/transactions-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly sapService: SapService) {}

  async findAll(
    query: TransactionsQueryDto,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const { page = 1, limit = 20, customerId, cardId, dateFrom, dateTo, minAmount, maxAmount } = query;

    this.logger.debug(`Fetching transactions from SAP with filters: ${JSON.stringify(query)}`);

    const { transactions, total } = await this.sapService.getTransactions(
      { customerId, cardId, dateFrom, dateTo, minAmount, maxAmount },
      page,
      limit,
    );

    const mapped = transactions.map((t) => this.mapToDto(t));
    return new PaginatedResponseDto(mapped, total, page, limit);
  }

  private mapToDto(t: any): TransactionResponseDto {
    return {
      id: t.id,
      cardId: t.cardId,
      customerId: t.customerId,
      date: t.date,
      time: t.time,
      description: t.description,
      merchantName: t.merchantName,
      merchantCategory: t.merchantCategory,
      amount: t.amount,
      currency: t.currency,
      type: t.type,
      status: t.status,
      authCode: t.authCode,
      country: t.country,
    };
  }
}
