import { Injectable, NotImplementedException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  async findMe(userId: string) {
    throw new NotImplementedException('Profile retrieval is not implemented yet');
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    throw new NotImplementedException('Profile update is not implemented yet');
  }
}
