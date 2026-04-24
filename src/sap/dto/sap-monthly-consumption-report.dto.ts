export class SapMonthlyConsumptionHeaderDto {
  customerCode: string;
  identification: string;
  customerName: string;
  cardNumber: string;
  cvv: string;
  expirationDate: string | null;
  status: string;
  overdueBalance: number;
  amountDue: number;
  paymentDueDate: string | null;
  creditLimit: number;
  message: string;
  availableCredit: number;
  usedCredit: number;
  issueDate: string | null;
  points: number;
}

export class SapMonthlyConsumptionItemDto {
  date: string | null;
  reference: string | null;
  description: string;
  amount: number;
  deferredBalance: number;
}

export class SapMonthlyConsumptionReportDto {
  header: SapMonthlyConsumptionHeaderDto;
  consumptions: SapMonthlyConsumptionItemDto[];
}
