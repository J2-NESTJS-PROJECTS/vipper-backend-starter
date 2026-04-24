import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateMonthlyConsumptionDto {
  @ApiPropertyOptional({
    example: '0917256331',
    description: 'Customer identification. Send exactly one of customerId or cardId.',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    example: '8355100049400010',
    description: 'Card number. Send exactly one of customerId or cardId.',
  })
  @IsOptional()
  @IsString()
  cardId?: string;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    example: '2026-04-23',
    description: 'Cutoff date used by SAP FECHA. Must belong to the requested month.',
  })
  @IsDateString()
  cutoffDate: string;
}
