import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchCatalogDto extends PaginationDto {
  @ApiProperty({ example: 'pizza' })
  @IsString()
  q: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  verticalId?: string;

  @ApiPropertyOptional({ example: -0.180653 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -78.467834 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
