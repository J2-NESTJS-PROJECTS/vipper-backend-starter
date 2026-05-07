import { Module } from '@nestjs/common';
import { PointRefundsController } from './point-refunds.controller';
import { PointRefundsService } from './point-refunds.service';

@Module({
  controllers: [PointRefundsController],
  providers: [PointRefundsService],
})
export class PointRefundsModule {}
