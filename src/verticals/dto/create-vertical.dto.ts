import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateVerticalDto {
  @ApiProperty({ example: 'Restaurantes' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'restaurantes' })
  @IsString()
  @MaxLength(120)
  slug: string;

  @ApiPropertyOptional({ example: 'Comida preparada y restaurantes locales' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.vipper.ec/icons/food.png' })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
