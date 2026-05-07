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

export class CreatePointRedemptionDto {
  @ApiProperty({ example: 'WEB-ORD-20260428-000123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  orderId: string;

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

  @ApiProperty({ example: 149.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  purchaseAmount: number;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  pointsUsed: number;

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

  @ApiProperty({ example: '2026-04-28T15:30:00Z' })
  @IsDateString()
  transactionAt: string;

  @ApiPropertyOptional({ example: 'Checkout web' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
