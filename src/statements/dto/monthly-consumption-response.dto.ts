import { ApiProperty } from '@nestjs/swagger';

export class MonthlyConsumptionHeaderDto {
  @ApiProperty({ example: '700012993' })
  customerCode: string;

  @ApiProperty({ example: '0917256331' })
  identification: string;

  @ApiProperty({ example: 'BANCHON NUNEZ JIM DAVIS' })
  customerName: string;

  @ApiProperty({ example: '8355100049400010' })
  cardNumber: string;

  @ApiProperty({ example: '984' })
  cvv: string;

  @ApiProperty({ example: '2026-07-10', nullable: true })
  expirationDate: string | null;

  @ApiProperty({ example: 'A' })
  status: string;

  @ApiProperty({ example: 52.13 })
  overdueBalance: number;

  @ApiProperty({ example: 15.29 })
  amountDue: number;

  @ApiProperty({ example: '2026-05-07', nullable: true })
  paymentDueDate: string | null;

  @ApiProperty({ example: 1200.0 })
  creditLimit: number;

  @ApiProperty({ example: 'Consulta exitosa' })
  message: string;

  @ApiProperty({ example: 1023.08 })
  availableCredit: number;

  @ApiProperty({ example: 176.92 })
  usedCredit: number;

  @ApiProperty({ example: '2021-07-10', nullable: true })
  issueDate: string | null;

  @ApiProperty({ example: 0 })
  points: number;
}

export class MonthlyConsumptionItemDto {
  @ApiProperty({ example: '2026-04-23', nullable: true })
  date: string | null;

  @ApiProperty({ example: '0001234567', nullable: true })
  reference: string | null;

  @ApiProperty({ example: 'COMPRA ALMACEN' })
  description: string;

  @ApiProperty({ example: 45.5 })
  amount: number;

  @ApiProperty({ example: 0 })
  deferredBalance: number;
}

export class MonthlyConsumptionResponseDto {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 4 })
  month: number;

  @ApiProperty({ type: MonthlyConsumptionHeaderDto })
  header: MonthlyConsumptionHeaderDto;

  @ApiProperty({ type: [MonthlyConsumptionItemDto] })
  consumptions: MonthlyConsumptionItemDto[];
}
