import { ApiProperty } from '@nestjs/swagger';

export class CardResponseDto {
  @ApiProperty({ example: 'CARD-001' })
  id: string;

  @ApiProperty({ example: '0000001234' })
  customerId: string;

  @ApiProperty({ example: '4111 **** **** 1111' })
  maskedNumber: string;

  @ApiProperty({ example: 'CREDIT' })
  type: string;

  @ApiProperty({ example: 'VISA' })
  brand: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 5000.00 })
  creditLimit: number;

  @ApiProperty({ example: 3500.00 })
  availableCredit: number;

  @ApiProperty({ example: 1500.00 })
  currentBalance: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: '12/2027' })
  expiryDate: string;

  @ApiProperty({ example: '01/2022' })
  issueDate: string;
}
