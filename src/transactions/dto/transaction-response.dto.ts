import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ example: 'TXN-00000001' })
  id: string;

  @ApiProperty({ example: 'CARD-001' })
  cardId: string;

  @ApiProperty({ example: '0000001234' })
  customerId: string;

  @ApiProperty({ example: '2024-06-15' })
  date: string;

  @ApiProperty({ example: '14:32:00' })
  time: string;

  @ApiProperty({ example: 'Purchase at Supermarket' })
  description: string;

  @ApiProperty({ example: 'SUPERMARKET XYZ' })
  merchantName: string;

  @ApiProperty({ example: '5411' })
  merchantCategory: string;

  @ApiProperty({ example: 125.50 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'PURCHASE' })
  type: string;

  @ApiProperty({ example: 'APPROVED' })
  status: string;

  @ApiProperty({ example: 'AUTH123456' })
  authCode: string;

  @ApiProperty({ example: 'EC' })
  country: string;
}
