import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationPlatform } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterNotificationTokenDto {
  @ApiProperty({ example: 'fcm-token' })
  @IsString()
  token: string;

  @ApiProperty({ enum: NotificationPlatform, example: NotificationPlatform.ANDROID })
  @IsEnum(NotificationPlatform)
  platform: NotificationPlatform;

  @ApiPropertyOptional({ example: 'device-id' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;
}
