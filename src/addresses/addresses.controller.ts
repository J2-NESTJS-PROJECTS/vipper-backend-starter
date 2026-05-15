import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('addresses')
@ApiBearerAuth('access-token')
@Controller('addresses')
@Roles(RoleType.CLIENT, RoleType.ADMIN, RoleType.SUPER_ADMIN)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer address' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customer addresses' })
  findAll(@CurrentUser('id') userId: string) {
    return this.addressesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer address detail' })
  findOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer address' })
  update(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(userId, id, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set default customer address' })
  setDefault(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.setDefault(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer address' })
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.remove(userId, id);
  }
}
