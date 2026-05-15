import { Injectable, NotImplementedException } from '@nestjs/common';
import { RegisterDriverLocationDto } from './dto/register-driver-location.dto';
import { UpdateDriverAvailabilityDto } from './dto/update-driver-availability.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';

@Injectable()
export class DriversService {
  async findMyProfile(userId: string) {
    throw new NotImplementedException('Driver profile retrieval is not implemented yet');
  }

  async updateMyProfile(userId: string, dto: UpdateDriverProfileDto) {
    throw new NotImplementedException('Driver profile update is not implemented yet');
  }

  async updateAvailability(userId: string, dto: UpdateDriverAvailabilityDto) {
    throw new NotImplementedException('Driver availability update is not implemented yet');
  }

  async registerLocation(userId: string, dto: RegisterDriverLocationDto) {
    throw new NotImplementedException('Driver location registration is not implemented yet');
  }
}
