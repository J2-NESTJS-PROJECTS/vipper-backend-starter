import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SapService } from '../sap/sap.service';
import { CardResponseDto } from './dto/card-response.dto';
import { CardTransactionsQueryDto } from './dto/card-transactions-query.dto';
import { CardStatementsQueryDto } from './dto/card-statements-query.dto';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';
import { StatementResponseDto } from '../statements/dto/statement-response.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(private readonly sapService: SapService) {}

  async findById(cardId: string): Promise<CardResponseDto> {
    this.logger.debug(`Fetching card ${cardId} from SAP`);
    const sapCard = await this.sapService.getCardById(cardId);

    if (!sapCard || !sapCard.id) {
      throw new NotFoundException(`Card ${cardId} not found in SAP`);
    }

    return this.mapToDto(sapCard);
  }

  async findCardTransactions(
    cardId: string,
    query: CardTransactionsQueryDto,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    this.logger.debug(`Fetching transactions for card ${cardId} from SAP`);
    await this.findById(cardId);

    const { page = 1, limit = 20, dateFrom, dateTo } = query;
    const { transactions, total } = await this.sapService.getCardTransactions(
      cardId,
      dateFrom,
      dateTo,
      page,
      limit,
    );

    const mapped = transactions.map((t) => this.mapTransaction(t));
    return new PaginatedResponseDto(mapped, total, page, limit);
  }

  async findCardStatements(
    cardId: string,
    query: CardStatementsQueryDto,
  ): Promise<StatementResponseDto[]> {
    this.logger.debug(`Fetching statements for card ${cardId} from SAP`);
    await this.findById(cardId);

    const sapStatements = await this.sapService.getCardStatements(
      cardId,
      query.year,
      query.month,
    );

    return sapStatements.map((s) => this.mapStatement(s));
  }

  private mapToDto(sapCard: any): CardResponseDto {
    return {
      id: sapCard.id,
      customerId: sapCard.customerId,
      maskedNumber: sapCard.maskedNumber,
      type: sapCard.type,
      brand: sapCard.brand,
      status: sapCard.status,
      creditLimit: sapCard.creditLimit,
      availableCredit: sapCard.availableCredit,
      currentBalance: sapCard.currentBalance,
      currency: sapCard.currency,
      expiryDate: sapCard.expiryDate,
      issueDate: sapCard.issueDate,
    };
  }

  private mapTransaction(t: any): TransactionResponseDto {
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

  private mapStatement(s: any): StatementResponseDto {
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
