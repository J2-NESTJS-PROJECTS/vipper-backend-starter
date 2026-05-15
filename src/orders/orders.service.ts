import { Injectable, NotImplementedException } from '@nestjs/common';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';

@Injectable()
export class OrdersService {
  async create(customerId: string, dto: CreateOrderDto) {
    throw new NotImplementedException('Order creation is not implemented yet');
  }

  async findAll(userId: string, query: FindOrdersDto) {
    throw new NotImplementedException('Order listing is not implemented yet');
  }

  async findOne(userId: string, id: string) {
    throw new NotImplementedException('Order retrieval is not implemented yet');
  }

  async changeStatus(userId: string, id: string, dto: ChangeOrderStatusDto) {
    throw new NotImplementedException('Order status update is not implemented yet');
  }

  async assignDriver(userId: string, id: string, dto: AssignDriverDto) {
    throw new NotImplementedException('Driver assignment is not implemented yet');
  }

  async getTracking(userId: string, id: string) {
    throw new NotImplementedException('Order tracking retrieval is not implemented yet');
  }
}
