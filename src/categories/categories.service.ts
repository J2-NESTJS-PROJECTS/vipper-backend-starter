import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FindCategoriesDto } from './dto/find-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  async create(userId: string, dto: CreateCategoryDto) {
    throw new NotImplementedException('Category creation is not implemented yet');
  }

  async findAll(query: FindCategoriesDto) {
    throw new NotImplementedException('Category listing is not implemented yet');
  }

  async findOne(id: string) {
    throw new NotImplementedException('Category retrieval is not implemented yet');
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    throw new NotImplementedException('Category update is not implemented yet');
  }

  async remove(userId: string, id: string) {
    throw new NotImplementedException('Category deletion is not implemented yet');
  }
}
