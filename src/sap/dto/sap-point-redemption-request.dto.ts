export class SapPointRedemptionRequestDto {
  orderId: string;
  cardNumber: string;
  documentNumber: string;
  customerName?: string;
  purchaseAmount: number;
  pointsUsed: number;
  currency: string;
  channel: string;
  storeCode?: string;
  transactionAt: string;
  notes?: string;
}
