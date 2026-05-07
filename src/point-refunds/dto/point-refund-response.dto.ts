import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PointRefundStatus } from '@prisma/client';

export class PointRefundResponseDto {
  @ApiProperty({ example: '3d2f3a6f-3b88-46ec-9fef-6f4762c2b678' })
  refundRecordId: string;

  @ApiProperty({ example: 'WEB-REF-20260428-000123' })
  refundId: string;

  @ApiProperty({ example: 'WEB-ORD-20260420-000777' })
  originalOrderId: string;

  @ApiProperty({ example: 'ECOMMERCE' })
  channel: string;

  @ApiProperty({ enum: PointRefundStatus, example: PointRefundStatus.PROCESSED })
  status: PointRefundStatus;

  @ApiProperty({ example: '0917256331' })
  documentNumber: string;

  @ApiProperty({ example: '8355100049400010' })
  cardNumber: string;

  @ApiProperty({ example: 49.99 })
  refundAmount: number;

  @ApiProperty({ example: 40 })
  pointsRefunded: number;

  @ApiPropertyOptional({ example: 920, nullable: true })
  remainingPoints?: number | null;

  @ApiPropertyOptional({ example: 'SAP-REF-000123456', nullable: true })
  sapReference?: string | null;

  @ApiPropertyOptional({ example: 'Point refund processed successfully', nullable: true })
  sapMessage?: string | null;

  @ApiPropertyOptional({ example: '2026-04-28T18:10:04.000Z', nullable: true })
  processedAt?: string | null;

  @ApiProperty({ example: 'Point refund processed successfully' })
  message: string;
}
