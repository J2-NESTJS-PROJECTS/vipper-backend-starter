import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  async create(userId: string, dto: CreateAddressDto) {
    throw new NotImplementedException('Address creation is not implemented yet');
  }

  async findAll(userId: string) {
    throw new NotImplementedException('Address listing is not implemented yet');
  }

  async findOne(userId: string, id: string) {
    throw new NotImplementedException('Address retrieval is not implemented yet');
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    throw new NotImplementedException('Address update is not implemented yet');
  }

  async remove(userId: string, id: string) {
    throw new NotImplementedException('Address deletion is not implemented yet');
  }

  async setDefault(userId: string, id: string) {
    throw new NotImplementedException('Default address update is not implemented yet');
  }
}
