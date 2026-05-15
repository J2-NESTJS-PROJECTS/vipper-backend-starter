import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  async create(userId: string, dto: CreateProductDto) {
    throw new NotImplementedException('Product creation is not implemented yet');
  }

  async findAll(query: FindProductsDto) {
    throw new NotImplementedException('Product listing is not implemented yet');
  }

  async findOne(id: string) {
    throw new NotImplementedException('Product retrieval is not implemented yet');
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    throw new NotImplementedException('Product update is not implemented yet');
  }

  async remove(userId: string, id: string) {
    throw new NotImplementedException('Product deletion is not implemented yet');
  }
}
