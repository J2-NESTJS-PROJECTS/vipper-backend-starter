import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DriversService } from './drivers.service';
import { RegisterDriverLocationDto } from './dto/register-driver-location.dto';
import { UpdateDriverAvailabilityDto } from './dto/update-driver-availability.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';

@ApiTags('drivers')
@ApiBearerAuth('access-token')
@Controller('drivers')
@Roles(RoleType.DRIVER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current driver profile' })
  findMyProfile(@CurrentUser('id') userId: string) {
    return this.driversService.findMyProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current driver profile' })
  updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateDriverProfileDto) {
    return this.driversService.updateMyProfile(userId, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Update driver availability' })
  updateAvailability(@CurrentUser('id') userId: string, @Body() dto: UpdateDriverAvailabilityDto) {
    return this.driversService.updateAvailability(userId, dto);
  }

  @Post('locations')
  @ApiOperation({ summary: 'Register driver location' })
  registerLocation(@CurrentUser('id') userId: string, @Body() dto: RegisterDriverLocationDto) {
    return this.driversService.registerLocation(userId, dto);
  }
}
