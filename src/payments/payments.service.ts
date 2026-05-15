import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { DatafastWebhookDto } from './dto/datafast-webhook.dto';

@Injectable()
export class PaymentsService {
  async create(userId: string, dto: CreatePaymentDto) {
    throw new NotImplementedException('Payment creation is not implemented yet');
  }

  async findOne(userId: string, id: string) {
    throw new NotImplementedException('Payment retrieval is not implemented yet');
  }

  async handleDatafastWebhook(dto: DatafastWebhookDto) {
    throw new NotImplementedException('Datafast webhook handling is not implemented yet');
  }
}
