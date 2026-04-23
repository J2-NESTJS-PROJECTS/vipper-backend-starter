import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export class SapCustomerResponseDto {
  @IsString()
  id: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsString()
  documentNumber: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsEnum(CustomerStatus)
  status: CustomerStatus;

  @IsNumber()
  creditLimit: number;

  @IsNumber()
  usedCredit: number;

  @IsNumber()
  availableCredit: number;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsNumber()
  overdueBalance?: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsDateString()
  nextPaymentDate?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  transactionNumber?: string;

  @IsOptional()
  @IsString()
  message?: string;
}