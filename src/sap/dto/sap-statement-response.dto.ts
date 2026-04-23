export class SapStatementResponseDto {
  id: string;
  cardId: string;
  customerId: string;
  period: string;
  year: number;
  month: number;
  openingBalance: number;
  closingBalance: number;
  totalCharges: number;
  totalPayments: number;
  minimumPayment: number;
  dueDate: string;
  currency: string;
  status: string;
}
