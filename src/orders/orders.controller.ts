import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(RoleType.CLIENT, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create order' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get()
  @Roles(RoleType.CLIENT, RoleType.BUSINESS_OWNER, RoleType.DRIVER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'List orders for current actor' })
  findAll(@CurrentUser('id') userId: string, @Query() query: FindOrdersDto) {
    return this.ordersService.findAll(userId, query);
  }

  @Get(':id')
  @Roles(RoleType.CLIENT, RoleType.BUSINESS_OWNER, RoleType.DRIVER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get order detail' })
  findOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(userId, id);
  }

  @Get(':id/tracking')
  @Roles(RoleType.CLIENT, RoleType.BUSINESS_OWNER, RoleType.DRIVER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get order tracking' })
  getTracking(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getTracking(userId, id);
  }

  @Patch(':id/status')
  @Roles(RoleType.BUSINESS_OWNER, RoleType.DRIVER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change order status' })
  changeStatus(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeOrderStatusDto) {
    return this.ordersService.changeStatus(userId, id, dto);
  }

  @Patch(':id/assign-driver')
  @Roles(RoleType.BUSINESS_OWNER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign driver to order' })
  assignDriver(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignDriverDto) {
    return this.ordersService.assignDriver(userId, id, dto);
  }
}
