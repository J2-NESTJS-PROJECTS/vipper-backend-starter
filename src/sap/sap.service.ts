import { Injectable, Logger } from '@nestjs/common';
import { SapRfcClientService } from './sap-rfc-client.service';
import { CustomerStatus, SapCustomerResponseDto } from './dto/sap-customer-response.dto';
import { SapCardResponseDto } from './dto/sap-card-response.dto';
import {
  SapMonthlyConsumptionItemDto,
  SapMonthlyConsumptionReportDto,
} from './dto/sap-monthly-consumption-report.dto';
import { SapTransactionResponseDto } from './dto/sap-transaction-response.dto';
import { SapStatementResponseDto } from './dto/sap-statement-response.dto';

@Injectable()
export class SapService {
  private readonly logger = new Logger(SapService.name);

  constructor(private readonly rfcClient: SapRfcClientService) {}

  async getCustomerById(customerId: string): Promise<SapCustomerResponseDto> {
    const result = await this.rfcClient.call('ZDATOS_TARJETA', {
      CEDULA: customerId,
    });

    return this.mapCustomer(result);
  }

  async getCustomerCards(customerId: string): Promise<SapCardResponseDto[]> {
    const result = await this.rfcClient.call('ZGET_CUSTOMER_CARDS', {
      I_KUNNR: customerId.padStart(10, '0'),
    });

    const cards = result.ET_CARDS || [];
    return cards.map((card: any) => this.mapCard(card));
  }

  async getCardById(cardId: string): Promise<SapCardResponseDto> {
    const result = await this.rfcClient.call('ZDATOS_TARJETA', {
      NUMTAR: cardId,
    });

    return this.mapCard(result);
  }

  async getMonthlyConsumptionReport(filters: {
    customerId?: string;
    cardId?: string;
    cutoffDate: string;
  }): Promise<SapMonthlyConsumptionReportDto> {
    const result = await this.rfcClient.call('ZDATOS_TARJETA', {
      CEDULA: filters.customerId || '',
      NUMTAR: filters.cardId || '',
      FECHA: this.formatSapDate(filters.cutoffDate),
    });

    return {
      header: this.mapMonthlyConsumptionHeader(result),
      consumptions: this.normalizeSapTable(result?.CONSUMOS)
        // SAP may return preallocated blank rows; keep only meaningful detail lines.
        .filter((item: any) => this.hasMonthlyConsumptionContent(item))
        .map((item: any) => this.mapMonthlyConsumptionItem(item)),
    };
  }

  async getCardTransactions(
    cardId: string,
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: SapTransactionResponseDto[]; total: number }> {
    const result = await this.rfcClient.call('ZGET_CARD_TRANSACTIONS', {
      I_CARD_ID: cardId,
      I_DATE_FROM: dateFrom || '',
      I_DATE_TO: dateTo || '',
      I_PAGE: page,
      I_ROWS: limit,
    });

    const transactions = (result.ET_TRANSACTIONS || []).map((t: any) =>
      this.mapTransaction(t),
    );
    const total = result.E_TOTAL || transactions.length;

    return { transactions, total };
  }

  async getCardStatements(
    cardId: string,
    year?: number,
    month?: number,
  ): Promise<SapStatementResponseDto[]> {
    const result = await this.rfcClient.call('ZGET_CARD_STATEMENTS', {
      I_CARD_ID: cardId,
      I_YEAR: year || 0,
      I_MONTH: month || 0,
    });

    return (result.ET_STATEMENTS || []).map((s: any) => this.mapStatement(s));
  }

  async getTransactions(
    filters: {
      customerId?: string;
      cardId?: string;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: number;
      maxAmount?: number;
    },
    page = 1,
    limit = 20,
  ): Promise<{ transactions: SapTransactionResponseDto[]; total: number }> {
    const result = await this.rfcClient.call('ZGET_TRANSACTIONS', {
      I_KUNNR: filters.customerId ? filters.customerId.padStart(10, '0') : '',
      I_CARD_ID: filters.cardId || '',
      I_DATE_FROM: filters.dateFrom || '',
      I_DATE_TO: filters.dateTo || '',
      I_AMT_FROM: filters.minAmount || 0,
      I_AMT_TO: filters.maxAmount || 0,
      I_PAGE: page,
      I_ROWS: limit,
    });

    const transactions = (result.ET_TRANSACTIONS || []).map((t: any) =>
      this.mapTransaction(t),
    );
    const total = result.E_TOTAL || transactions.length;

    return { transactions, total };
  }

  async getStatements(
    filters: { customerId?: string; cardId?: string; year?: number; month?: number },
    page = 1,
    limit = 20,
  ): Promise<{ statements: SapStatementResponseDto[]; total: number }> {
    const result = await this.rfcClient.call('ZGET_STATEMENTS', {
      I_KUNNR: filters.customerId ? filters.customerId.padStart(10, '0') : '',
      I_CARD_ID: filters.cardId || '',
      I_YEAR: filters.year || 0,
      I_MONTH: filters.month || 0,
      I_PAGE: page,
      I_ROWS: limit,
    });

    const statements = (result.ET_STATEMENTS || []).map((s: any) =>
      this.mapStatement(s),
    );
    const total = result.E_TOTAL || statements.length;

    return { statements, total };
  }

  private mapCustomer(raw: any): SapCustomerResponseDto {
    if (!raw) return null;

    const clean = (val: any) => (val || '').toString().trim();

    const parseDate = (val: string) => {
      if (!val || val === '00000000') return null;
      return `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
    };

    return {
      id: clean(raw.COD_CLIENTE),
      fullName: clean(raw.CLIENTE),

      documentType: clean(raw.STCD1),
      documentNumber: clean(raw.CEDULA || raw.IDENTIFICACION),

      email: clean(raw.EMAIL),
      phone: clean(raw.TELEFONO),

      address: clean(raw.DIRECCION),
      city: clean(raw.CIUDAD),
      country: clean(raw.PAIS) || 'EC',

      // estado real
      status: clean(raw.ESTD_TR) === 'A' ? CustomerStatus.ACTIVE : CustomerStatus.BLOCKED,

      // financieros
      creditLimit: parseFloat(raw.CUPO || '0'),
      usedCredit: parseFloat(raw.UTILIZADO || '0'),
      availableCredit: parseFloat(raw.SALDO || '0'),
      balance: parseFloat(raw.SALDO_PAGAR || '0'),
      overdueBalance: parseFloat(raw.SALDO_VENCIDO || '0'),

      // fechas importantes
      expirationDate: parseDate(raw.FECHA_CADUCIDAD),
      nextPaymentDate: parseDate(raw.FECHA_PAGAR),

      // tarjeta / transacción
      cardNumber: clean(raw.NUMTR),
      transactionNumber: clean(raw.NUMTAR),

      message: clean(raw.MENSAJE),
    };
  }

  private mapMonthlyConsumptionHeader(raw: any) {
    const clean = (val: any) => (val || '').toString().trim();

    return {
      customerCode: clean(raw.COD_CLIENTE),
      identification: clean(raw.CEDULA || raw.IDENTIFICACION),
      customerName: clean(raw.CLIENTE),
      cardNumber: clean(raw.NUMTR),
      cvv: clean(raw.CVV),
      expirationDate: this.parseDateValue(clean(raw.FECHA_CADUCIDAD)),
      status: clean(raw.ESTD_TR),
      overdueBalance: this.parseAmount(raw.SALDO_VENCIDO),
      amountDue: this.parseAmount(raw.SALDO_PAGAR),
      paymentDueDate: this.parseDateValue(clean(raw.FECHA_PAGAR)),
      creditLimit: this.parseAmount(raw.CUPO),
      message: clean(raw.MENSAJE),
      availableCredit: this.parseAmount(raw.SALDO),
      usedCredit: this.parseAmount(raw.UTILIZADO),
      issueDate: this.parseDateValue(clean(raw.FECHA_EMISION)),
      points: this.parseAmount(raw.PUNTOS),
    };
  }

  private mapMonthlyConsumptionItem(raw: any): SapMonthlyConsumptionItemDto {
    const description = (raw.SGTXT || '').trim();
    const isBalanceLine = description.includes('*** SALDO');

    return {
      date: isBalanceLine ? null : this.parseDateValue((raw.BLDAT || '').trim()),
      reference: isBalanceLine ? null : (raw.XBLNR || '').trim() || null,
      description,
      amount: this.parseAmount(raw.DMBTR),
      deferredBalance: this.parseAmount(raw.SALTR),
    };
  }

  private hasMonthlyConsumptionContent(raw: any): boolean {
    return Boolean((raw?.SGTXT || '').toString().trim());
  }

  private mapCard(raw: any): SapCardResponseDto {
    if (!raw) return null;
    return {
      id: (raw.CARD_ID || '').trim(),
      customerId: (raw.KUNNR || '').trim(),
      maskedNumber: (raw.CARD_NUM || '').trim(),
      type: (raw.CARD_TYPE || '').trim(),
      brand: (raw.CARD_BRAND || '').trim(),
      status: (raw.STATUS || '').trim(),
      creditLimit: parseFloat(raw.CREDIT_LIMIT || '0'),
      availableCredit: parseFloat(raw.AVAILABLE_CREDIT || '0'),
      currentBalance: parseFloat(raw.CURRENT_BALANCE || '0'),
      currency: (raw.CURRENCY || 'USD').trim(),
      expiryDate: (raw.EXPIRY_DATE || '').trim(),
      issueDate: (raw.ISSUE_DATE || '').trim(),
    };
  }

  private mapTransaction(raw: any): SapTransactionResponseDto {
    if (!raw) return null;
    return {
      id: (raw.TRANS_ID || '').trim(),
      cardId: (raw.CARD_ID || '').trim(),
      customerId: (raw.KUNNR || '').trim(),
      date: (raw.TRANS_DATE || '').trim(),
      time: (raw.TRANS_TIME || '').trim(),
      description: (raw.DESCRIPTION || '').trim(),
      merchantName: (raw.MERCHANT || '').trim(),
      merchantCategory: (raw.MCC || '').trim(),
      amount: parseFloat(raw.AMOUNT || '0'),
      currency: (raw.CURRENCY || 'USD').trim(),
      type: (raw.TRANS_TYPE || '').trim(),
      status: (raw.STATUS || '').trim(),
      authCode: (raw.AUTH_CODE || '').trim(),
      country: (raw.COUNTRY || '').trim(),
    };
  }

  private mapStatement(raw: any): SapStatementResponseDto {
    if (!raw) return null;
    return {
      id: (raw.STATEMENT_ID || '').trim(),
      cardId: (raw.CARD_ID || '').trim(),
      customerId: (raw.KUNNR || '').trim(),
      period: (raw.PERIOD || '').trim(),
      year: parseInt(raw.YEAR || '0'),
      month: parseInt(raw.MONTH || '0'),
      openingBalance: parseFloat(raw.OPENING_BAL || '0'),
      closingBalance: parseFloat(raw.CLOSING_BAL || '0'),
      totalCharges: parseFloat(raw.TOTAL_CHARGES || '0'),
      totalPayments: parseFloat(raw.TOTAL_PAYMENTS || '0'),
      minimumPayment: parseFloat(raw.MIN_PAYMENT || '0'),
      dueDate: (raw.DUE_DATE || '').trim(),
      currency: (raw.CURRENCY || 'USD').trim(),
      status: (raw.STATUS || '').trim(),
    };
  }

  private normalizeSapTable(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.item)) return raw.item;
    if (raw.item) return [raw.item];
    return [];
  }

  private parseAmount(raw: any): number {
    const value = Number.parseFloat((raw || '0').toString().replace(/,/g, ''));
    return Number.isNaN(value) ? 0 : value;
  }

  private parseDateValue(raw: string): string | null {
    if (!raw || raw === '00000000') return null;

    if (/^\d{8}$/.test(raw)) {
      return `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
    }

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
      const [day, month, year] = raw.split('.');
      return `${year}-${month}-${day}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    return raw;
  }

  private formatSapDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  }
}
