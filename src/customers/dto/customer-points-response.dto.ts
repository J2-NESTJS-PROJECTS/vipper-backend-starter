import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerPointsResponseDto {
  @ApiProperty({ example: '0700012993' })
  customerId: string;

  @ApiProperty({ example: '0917256331' })
  documentNumber: string;

  @ApiProperty({ example: 'BANCHON NUNEZ JIM DAVIS' })
  fullName: string;

  @ApiPropertyOptional({ example: '8355100049400010' })
  cardNumber?: string;

  @ApiProperty({ example: 0 })
  points: number;
}
