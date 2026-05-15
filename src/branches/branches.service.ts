import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { FindBranchesDto } from './dto/find-branches.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  async create(userId: string, dto: CreateBranchDto) {
    throw new NotImplementedException('Branch creation is not implemented yet');
  }

  async findAll(query: FindBranchesDto) {
    throw new NotImplementedException('Branch listing is not implemented yet');
  }

  async findOne(id: string) {
    throw new NotImplementedException('Branch retrieval is not implemented yet');
  }

  async update(userId: string, id: string, dto: UpdateBranchDto) {
    throw new NotImplementedException('Branch update is not implemented yet');
  }

  async remove(userId: string, id: string) {
    throw new NotImplementedException('Branch deletion is not implemented yet');
  }
}
