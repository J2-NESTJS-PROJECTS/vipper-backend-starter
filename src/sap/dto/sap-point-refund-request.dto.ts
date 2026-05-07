export class SapPointRefundRequestDto {
  refundId: string;
  originalOrderId: string;
  cardNumber: string;
  documentNumber: string;
  customerName?: string;
  refundAmount: number;
  pointsRefunded: number;
  currency: string;
  channel: string;
  storeCode?: string;
  transactionAt: string;
  reason?: string;
  notes?: string;
}
