import { Module } from '@nestjs/common';
import { PointRedemptionsController } from './point-redemptions.controller';
import { PointRedemptionsService } from './point-redemptions.service';

@Module({
  controllers: [PointRedemptionsController],
  providers: [PointRedemptionsService],
})
export class PointRedemptionsModule {}
