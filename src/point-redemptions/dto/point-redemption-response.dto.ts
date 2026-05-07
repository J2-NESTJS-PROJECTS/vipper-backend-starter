import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PointRedemptionStatus } from '@prisma/client';

export class PointRedemptionResponseDto {
  @ApiProperty({ example: '5f43ebd1-53b0-4dc1-9ad6-5e18dc1e7e0d' })
  redemptionId: string;

  @ApiProperty({ example: 'WEB-ORD-20260428-000123' })
  orderId: string;

  @ApiProperty({ example: 'ECOMMERCE' })
  channel: string;

  @ApiProperty({ enum: PointRedemptionStatus, example: PointRedemptionStatus.PROCESSED })
  status: PointRedemptionStatus;

  @ApiProperty({ example: '0917256331' })
  documentNumber: string;

  @ApiProperty({ example: '8355100049400010' })
  cardNumber: string;

  @ApiProperty({ example: 149.99 })
  purchaseAmount: number;

  @ApiProperty({ example: 120 })
  pointsUsed: number;

  @ApiPropertyOptional({ example: 880, nullable: true })
  remainingPoints?: number | null;

  @ApiPropertyOptional({ example: 'SAP-000123456', nullable: true })
  sapReference?: string | null;

  @ApiPropertyOptional({ example: 'Point redemption processed successfully', nullable: true })
  sapMessage?: string | null;

  @ApiPropertyOptional({ example: '2026-04-28T15:30:05.000Z', nullable: true })
  processedAt?: string | null;

  @ApiProperty({ example: 'Point redemption processed successfully' })
  message: string;
}
