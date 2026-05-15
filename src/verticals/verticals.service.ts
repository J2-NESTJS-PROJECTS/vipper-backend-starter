import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateVerticalDto } from './dto/create-vertical.dto';
import { UpdateVerticalDto } from './dto/update-vertical.dto';

@Injectable()
export class VerticalsService {
  async create(dto: CreateVerticalDto) {
    throw new NotImplementedException('Vertical creation is not implemented yet');
  }

  async findAll(pagination: PaginationDto) {
    throw new NotImplementedException('Vertical listing is not implemented yet');
  }

  async findOne(id: string) {
    throw new NotImplementedException('Vertical retrieval is not implemented yet');
  }

  async update(id: string, dto: UpdateVerticalDto) {
    throw new NotImplementedException('Vertical update is not implemented yet');
  }

  async remove(id: string) {
    throw new NotImplementedException('Vertical deletion is not implemented yet');
  }
}
