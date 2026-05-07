import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePointRefundDto {
  @ApiProperty({ example: 'WEB-REF-20260428-000123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  refundId: string;

  @ApiProperty({ example: 'WEB-ORD-20260420-000777' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  originalOrderId: string;

  @ApiProperty({ example: '8355100049400010' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  cardNumber: string;

  @ApiProperty({ example: '0917256331' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber: string;

  @ApiPropertyOptional({ example: 'JUAN PEREZ' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  customerName?: string;

  @ApiProperty({ example: 49.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  refundAmount: number;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  pointsRefunded: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string = 'USD';

  @ApiPropertyOptional({ example: 'ECOMMERCE', default: 'ECOMMERCE' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  channel?: string = 'ECOMMERCE';

  @ApiPropertyOptional({ example: 'WEB' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  storeCode?: string;

  @ApiProperty({ example: '2026-04-28T18:10:00Z' })
  @IsDateString()
  transactionAt: string;

  @ApiPropertyOptional({ example: 'Customer canceled order' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ example: 'Refund from ecommerce checkout' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
