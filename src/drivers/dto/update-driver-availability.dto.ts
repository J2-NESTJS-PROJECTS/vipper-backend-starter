import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';

export class UpdateDriverAvailabilityDto {
  @ApiProperty({ enum: DriverStatus })
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;
}
