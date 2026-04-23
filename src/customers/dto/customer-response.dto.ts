import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from "@sap/dto/sap-customer-response.dto";
import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CustomerResponseDto {
  @ApiProperty({ example: '' })
  @IsString()
  id: string;

  @ApiProperty({ example: '' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '' })
  @IsString()
  documentNumber: string;

  @ApiProperty({ enum: CustomerStatus, example: CustomerStatus.ACTIVE })
  @IsEnum(CustomerStatus)
  status: CustomerStatus;

  // financieros
  @ApiProperty({ example: 0.0 })
  @IsNumber()
  creditLimit: number;

  @ApiProperty({ example: 0.0 })
  @IsNumber()
  usedCredit: number;

  @ApiProperty({ example: 0.0 })
  @IsNumber()
  availableCredit: number;

  @ApiProperty({ example: 0.0 })
  @IsNumber()
  balance?: number;

  @ApiProperty({ example: 0.0 })
  @IsNumber()
  overdueBalance?: number;

  // fechas
  @ApiPropertyOptional({ example: '2027-10-19' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsDateString()
  nextPaymentDate?: string;

  // tarjeta / transacción
  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

}