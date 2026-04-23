import { ApiProperty } from '@nestjs/swagger';

export class StatementResponseDto {
  @ApiProperty({ example: 'STMT-00000001' })
  id: string;

  @ApiProperty({ example: 'CARD-001' })
  cardId: string;

  @ApiProperty({ example: '0000001234' })
  customerId: string;

  @ApiProperty({ example: '2024-06' })
  period: string;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: 6 })
  month: number;

  @ApiProperty({ example: 1000.00 })
  openingBalance: number;

  @ApiProperty({ example: 1500.00 })
  closingBalance: number;

  @ApiProperty({ example: 800.00 })
  totalCharges: number;

  @ApiProperty({ example: 300.00 })
  totalPayments: number;

  @ApiProperty({ example: 150.00 })
  minimumPayment: number;

  @ApiProperty({ example: '2024-07-15' })
  dueDate: string;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'CLOSED' })
  status: string;
}
