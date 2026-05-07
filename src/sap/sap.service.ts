import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { SapRfcClientService } from "./sap-rfc-client.service";
import {
  CustomerStatus,
  SapCustomerResponseDto,
} from "./dto/sap-customer-response.dto";
import { SapCardResponseDto } from "./dto/sap-card-response.dto";
import {
  SapMonthlyConsumptionItemDto,
  SapMonthlyConsumptionReportDto,
} from "./dto/sap-monthly-consumption-report.dto";
import { SapPointRefundRequestDto } from "./dto/sap-point-refund-request.dto";
import { SapPointRefundResponseDto } from "./dto/sap-point-refund-response.dto";
import { SapPointRedemptionRequestDto } from "./dto/sap-point-redemption-request.dto";
import { SapPointRedemptionResponseDto } from "./dto/sap-point-redemption-response.dto";
import { SapTransactionResponseDto } from "./dto/sap-transaction-response.dto";
import { SapStatementResponseDto } from "./dto/sap-statement-response.dto";

@Injectable()
export class SapService {
  private readonly logger = new Logger(SapService.name);

  constructor(private readonly rfcClient: SapRfcClientService) {}

  async getCustomerById(customerId: string): Promise<SapCustomerResponseDto> {
    const result = await this.rfcClient.call("ZDATOS_TARJETA", {
      CEDULA: customerId,
    });

    return this.mapCustomer(result);
  }

  async getCustomerCards(customerId: string): Promise<SapCardResponseDto[]> {
    const result = await this.rfcClient.call("ZGET_CUSTOMER_CARDS", {
      I_KUNNR: customerId.padStart(10, "0"),
    });

    const cards = result.ET_CARDS || [];
    return cards.map((card: any) => this.mapCard(card));
  }

  async getCardById(cardId: string): Promise<SapCardResponseDto> {
    const result = await this.rfcClient.call("ZDATOS_TARJETA", {
      NUMTAR: cardId,
    });

    return this.mapCard(result);
  }

  async redeemPoints(
    input: SapPointRedemptionRequestDto,
    operator: string,
  ): Promise<SapPointRedemptionResponseDto> {
    const result = await this.zdiPuntosBono(
      input.cardNumber,
      input.pointsUsed,
      operator,
    );

    if (!result) return null;
    const puntosDisponibles = await this.getCustomerById(input.documentNumber);
    if (!(result.RETURN.slice(0, 2) === "00")) {
      // return {
      //   success: false,
      //   sapReference: "referencia sap",
      //   message: result.RETURN || "mensaje sap",
      //   remainingPoints: puntosDisponibles.points || 0,
      //   raw: { result },
      // };
      return this.mapRedempPoints(result, puntosDisponibles.points, false);
    }

    // return {
    //   success: true,
    //   sapReference: "referencia sap",
    //   message: result.RETURN || "mensaje sap",
    //   remainingPoints: puntosDisponibles.points || 0,
    //   raw: { result },
    // };
    return this.mapRedempPoints(result, puntosDisponibles.points, true);
  }

  async refundPoints(
    input: SapPointRefundRequestDto,
    operator: string,
  ): Promise<SapPointRefundResponseDto> {
    const result = await this.zdiPuntosBono(
      input.cardNumber,
      input.pointsRefunded,
      operator,
    );

    if (!result) return null;
    const puntosDisponibles = await this.getCustomerById(input.documentNumber);
    if (!(result.RETURN.slice(0, 2) === "00")) {
      // return {
      //   success: false,
      //   sapReference: "referencia sap",
      //   message: result.RETURN || "mensaje sap",
      //   remainingPoints: puntosDisponibles.points || 0,
      //   raw: { result },
      // };
      return this.mapRedempPoints(result, puntosDisponibles.points, false);
    }

    // return {
    //   success: true,
    //   sapReference: "referencia sap",
    //   message: result.RETURN || "mensaje sap",
    //   remainingPoints: puntosDisponibles.points || 0,
    //   raw: { result },
    // };
    return this.mapRedempPoints(result, puntosDisponibles.points, true);
  }

  async getMonthlyConsumptionReport(filters: {
    customerId?: string;
    cutoffDate: string;
  }): Promise<SapMonthlyConsumptionReportDto> {
    const result = await this.rfcClient.call("ZDI_ESTADO_CUENTA", {
      P_BUKRS: "1010",
      STCD1: filters.customerId || "",
      P_ZTPNR: "02",
      P_ZORNR: filters.cutoffDate,
      CABECERA: [],
      DETALLE: [],
    });

    const headerItem = this.normalizeSapTable(result?.CABECERA)[0] || {};
    const identification = (
      (result?.STCD1 || filters.customerId || "") as string
    ).trim();

    return {
      header: this.mapMonthlyConsumptionHeader(headerItem, identification),
      consumptions: this.normalizeSapTable(result?.DETALLE)
        // SAP may return preallocated blank rows; keep only meaningful detail lines.
        .filter((item: any) => this.hasMonthlyConsumptionContent(item))
        .map((item: any) => this.mapMonthlyConsumptionItem(item)),
    };
  }

  async getAccountStatement(filters: {
    customerId: string;
    cutoffDate: string;
  }): Promise<{
    companyCode: string;
    period: string;
    identification: string;
    header: any | null;
    details: any[];
  }> {
    const result = await this.rfcClient.call("ZDI_ESTADO_CUENTA", {
      P_BUKRS: "1010",
      STCD1: filters.customerId || "",
      P_ZTPNR: "02",
      P_ZORNR: filters.cutoffDate,
      CABECERA: [],
      DETALLE: [],
    });

    const header = this.normalizeSapTable(result?.CABECERA)[0] || null;
    const details = this.normalizeSapTable(result?.DETALLE).filter(
      (item: any) => this.hasMonthlyConsumptionContent(item),
    );

    return {
      companyCode: ((result?.P_BUKRS || "1010") as string).trim(),
      period: ((result?.P_ZORNR || filters.cutoffDate || "") as string).trim(),
      identification: (
        (result?.STCD1 || filters.customerId || "") as string
      ).trim(),
      header,
      details,
    };
  }

  async getCardTransactions(
    cardId: string,
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: SapTransactionResponseDto[]; total: number }> {
    const result = await this.rfcClient.call("ZGET_CARD_TRANSACTIONS", {
      I_CARD_ID: cardId,
      I_DATE_FROM: dateFrom || "",
      I_DATE_TO: dateTo || "",
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
    const result = await this.rfcClient.call("ZGET_CARD_STATEMENTS", {
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
    },
    page = 1,
    limit = 20,
  ): Promise<{ transactions: SapTransactionResponseDto[]; total: number }> {
    const sapCardNumber = this.toSapCardNumber(filters.cardId);
    const sapDate = filters.dateTo
      ? this.formatSapDate(filters.dateTo)
      : "01.01.2026";

    this.logger.debug(
      `Calling ZDATOS_TARJETA for transactions with NUMTAR=${this.maskCardNumber(sapCardNumber)} FECHA=${sapDate}`,
    );

    const result = await this.rfcClient.call("ZDATOS_TARJETA", {
      CEDULA: filters.customerId || "",
      NUMTAR: sapCardNumber,
      FECHA: sapDate,
      CONSUMOS: [],
    });

    const consumos = this.normalizeSapTable(result?.CONSUMOS);
    this.logger.debug(
      `ZDATOS_TARJETA returned CONSUMOS rows: ${consumos.length}`,
    );

    const transactions = consumos.map((t: any) => this.mapTransaction(t));
    const total = result.E_TOTAL || transactions.length;

    return { transactions, total };
  }

  async getStatements(
    filters: {
      customerId?: string;
      cardId?: string;
      year?: number;
      month?: number;
    },
    page = 1,
    limit = 20,
  ): Promise<{ statements: SapStatementResponseDto[]; total: number }> {
    const result = await this.rfcClient.call("ZGET_STATEMENTS", {
      I_KUNNR: filters.customerId ? filters.customerId.padStart(10, "0") : "",
      I_CARD_ID: filters.cardId || "",
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

    const clean = (val: any) => (val || "").toString().trim();

    const parseDate = (val: string) => {
      if (!val || val === "00000000") return null;
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
      country: clean(raw.PAIS) || "EC",

      // estado real
      status:
        clean(raw.ESTD_TR) === "A"
          ? CustomerStatus.ACTIVE
          : CustomerStatus.BLOCKED,

      // financieros
      creditLimit: parseFloat(raw.CUPO || "0"),
      usedCredit: parseFloat(raw.UTILIZADO || "0"),
      availableCredit: parseFloat(raw.SALDO || "0"),
      balance: parseFloat(raw.SALDO_PAGAR || "0"),
      overdueBalance: parseFloat(raw.SALDO_VENCIDO || "0"),

      // fechas importantes
      expirationDate: parseDate(raw.FECHA_CADUCIDAD),
      nextPaymentDate: parseDate(raw.FECHA_PAGAR),
      issueDate: parseDate(raw.FECHA_EMISION),

      // tarjeta / transacción
      cardNumber: clean(raw.NUMTR),
      transactionNumber: clean(raw.NUMTAR),

      // puntos
      points: parseFloat(raw.PUNTOS || "0"),

      message: clean(raw.MENSAJE),
    };
  }

  private mapMonthlyConsumptionHeader(raw: any, identification: string) {
    const clean = (val: any) => (val || "").toString().trim();

    const overdueBalance = this.parseAmount(raw.VLVEN);
    const minimumRotative = this.parseAmount(raw.VLROT);
    const deferredInstallment = this.parseAmount(raw.VLDIF);
    const monthlyCharges = this.parseAmount(raw.VLCAR);
    const minimumPayment =
      overdueBalance + minimumRotative + deferredInstallment + monthlyCharges;
    const deferredTotal = this.parseAmount(raw.DIFTR);
    const usedCredit = minimumPayment + deferredTotal;
    const creditLimit = this.parseAmount(raw.CUPTR);
    const availableCredit = creditLimit - usedCredit;

    return {
      customerCode: clean(raw.KUNNR),
      identification,
      customerName: clean(raw.NOMBR),
      cardNumber: clean(raw.NUMTR),
      cvv: "",
      expirationDate: null,
      status: "",
      overdueBalance,
      amountDue: minimumPayment,
      paymentDueDate: this.parseDateValue(clean(raw.FECPA)),
      creditLimit,
      message: "",
      availableCredit,
      usedCredit,
      issueDate: null,
      points: 0,
    };
  }

  private mapMonthlyConsumptionItem(raw: any): SapMonthlyConsumptionItemDto {
    const description = (raw.SGTXT || "").trim();
    const isBalanceLine = description.includes("*** SALDO");

    return {
      date: isBalanceLine
        ? null
        : this.parseDateValue((raw.BLDAT || "").trim()),
      reference: isBalanceLine ? null : (raw.XBLNR || "").trim() || null,
      description,
      amount: this.parseAmount(raw.DMBTR),
      deferredBalance: this.parseAmount(raw.SALTR),
    };
  }

  private hasMonthlyConsumptionContent(raw: any): boolean {
    return Boolean((raw?.SGTXT || "").toString().trim());
  }

  private mapRedempPoints(
    raw: any,
    puntos: number,
    success: boolean,
  ): SapPointRedemptionResponseDto {
    return {
      success: success,
      sapReference: "referencia sap",
      message: raw.RETURN || "mensaje sap",
      remainingPoints: puntos,
      raw: { raw },
    };
  }
  private mapCard(raw: any): SapCardResponseDto {
    if (!raw) return null;
    return {
      id: (raw.CARD_ID || "").trim(),
      customerId: (raw.KUNNR || "").trim(),
      maskedNumber: (raw.CARD_NUM || "").trim(),
      type: (raw.CARD_TYPE || "").trim(),
      brand: (raw.CARD_BRAND || "").trim(),
      status: (raw.STATUS || "").trim(),
      creditLimit: parseFloat(raw.CREDIT_LIMIT || "0"),
      availableCredit: parseFloat(raw.AVAILABLE_CREDIT || "0"),
      currentBalance: parseFloat(raw.CURRENT_BALANCE || "0"),
      currency: (raw.CURRENCY || "USD").trim(),
      expiryDate: (raw.EXPIRY_DATE || "").trim(),
      issueDate: (raw.ISSUE_DATE || "").trim(),
    };
  }

  private mapTransaction(raw: any): SapTransactionResponseDto {
    if (!raw) return null;

    const docNo = (raw.DOC_NO || raw.TRANS_ID || "").trim();
    const itemNum = (raw.ITEM_NUM || "").trim();
    const customerId = (raw.CUSTOMER || raw.KUNNR || "").trim();

    const amount = this.parseAmount(
      raw.AMOUNT || raw.AMT_DOCCUR || raw.LC_AMOUNT,
    );
    const signedAmount =
      (raw.DB_CR_IND || "").trim() === "H" ? -Math.abs(amount) : amount;

    const clearDate = (raw.CLEAR_DATE || "").trim();
    const docStatus = (raw.DOC_STATUS || "").trim();
    const status =
      docStatus || (clearDate && clearDate !== "00000000" ? "CLEARED" : "OPEN");

    return {
      id: itemNum ? `${docNo}-${itemNum}` : docNo,
      cardId: (raw.NUMTR || raw.CARD_ID || "").trim(),
      customerId,
      date: this.parseDateValue(
        (raw.PSTNG_DATE || raw.DOC_DATE || raw.ENTRY_DATE || "").trim(),
      ),
      time: (raw.TRANS_TIME || "").trim(),
      description: (
        raw.ITEM_TEXT ||
        raw.DESCRIPTION ||
        raw.REF_DOC_NO ||
        raw.ALLOC_NMBR ||
        ""
      ).trim(),
      merchantName: (raw.NAME || raw.NAME_2 || raw.MERCHANT || "").trim(),
      merchantCategory: (raw.DOC_TYPE || raw.MCC || "").trim(),
      amount: signedAmount,
      currency: (
        raw.CURRENCY ||
        raw.T_CURRENCY ||
        raw.LOC_CURRCY ||
        "USD"
      ).trim(),
      type: (raw.DOC_TYPE || raw.TRANS_TYPE || raw.POST_KEY || "").trim(),
      status,
      authCode: (
        raw.REF_DOC_NO_LONG ||
        raw.REF_DOC_NO ||
        raw.AUTH_CODE ||
        ""
      ).trim(),
      country: (raw.COUNTRY || "").trim(),
    };
  }

  private mapStatement(raw: any): SapStatementResponseDto {
    if (!raw) return null;
    return {
      id: (raw.STATEMENT_ID || "").trim(),
      cardId: (raw.CARD_ID || "").trim(),
      customerId: (raw.KUNNR || "").trim(),
      period: (raw.PERIOD || "").trim(),
      year: parseInt(raw.YEAR || "0"),
      month: parseInt(raw.MONTH || "0"),
      openingBalance: parseFloat(raw.OPENING_BAL || "0"),
      closingBalance: parseFloat(raw.CLOSING_BAL || "0"),
      totalCharges: parseFloat(raw.TOTAL_CHARGES || "0"),
      totalPayments: parseFloat(raw.TOTAL_PAYMENTS || "0"),
      minimumPayment: parseFloat(raw.MIN_PAYMENT || "0"),
      dueDate: (raw.DUE_DATE || "").trim(),
      currency: (raw.CURRENCY || "USD").trim(),
      status: (raw.STATUS || "").trim(),
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
    const value = Number.parseFloat((raw || "0").toString().replace(/,/g, ""));
    return Number.isNaN(value) ? 0 : value;
  }

  private parseDateValue(raw: string): string | null {
    if (!raw || raw === "00000000") return null;

    if (/^\d{8}$/.test(raw)) {
      return `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
    }

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
      const [day, month, year] = raw.split(".");
      return `${year}-${month}-${day}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    return raw;
  }

  private formatSapDate(date: string): string {
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  }

  private toSapCardNumber(cardId?: string): string {
    const digits = (cardId || "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.padStart(16, "0").slice(-16);
  }

  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return "<empty>";
    if (cardNumber.length <= 4) return cardNumber;
    return `${"*".repeat(cardNumber.length - 4)}${cardNumber.slice(-4)}`;
  }

  private getDateYYMMDD(date = new Date()) {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yy}${mm}${dd}`;
  }
  private generateRandom6DigitsString() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async zdiPuntosBono(
    cardNumber: string,
    pointsUsedOrRefunded: number,
    operator: string,
  ) {
    // this.logger.warn(
    //   `Point redemption requested for orderId=${input.orderId}, but SAP point redemption is not configured yet`,
    // );

    // throw new ServiceUnavailableException(
    //   'SAP point redemption function is not configured yet',
    // );
    const result = await this.rfcClient.call("ZDI_PUNTOSBONO", {
      NUNTR: cardNumber,
      ESTAB: "7100038994",
      REFTR: this.getDateYYMMDD(),
      LOTTR: this.generateRandom6DigitsString(),
      IMPPB: String(pointsUsedOrRefunded),
      SIGNO: operator,
    });
    //console.log({ result });
    return result;
  }
}
