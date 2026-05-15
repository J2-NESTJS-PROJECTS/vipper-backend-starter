import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { FindBusinessesDto } from './dto/find-businesses.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  async create(userId: string, dto: CreateBusinessDto) {
    throw new NotImplementedException('Business creation is not implemented yet');
  }

  async findAll(query: FindBusinessesDto) {
    throw new NotImplementedException('Business listing is not implemented yet');
  }

  async findOne(id: string) {
    throw new NotImplementedException('Business retrieval is not implemented yet');
  }

  async update(userId: string, id: string, dto: UpdateBusinessDto) {
    throw new NotImplementedException('Business update is not implemented yet');
  }

  async remove(userId: string, id: string) {
    throw new NotImplementedException('Business deletion is not implemented yet');
  }
}
