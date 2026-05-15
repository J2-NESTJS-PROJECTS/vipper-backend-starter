import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class DatafastWebhookDto {
  @ApiPropertyOptional({ example: 'payment.succeeded' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ example: 'provider-transaction-id' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
