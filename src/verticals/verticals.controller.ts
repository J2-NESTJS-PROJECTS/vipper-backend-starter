import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateVerticalDto } from './dto/create-vertical.dto';
import { UpdateVerticalDto } from './dto/update-vertical.dto';
import { VerticalsService } from './verticals.service';

@ApiTags('verticals')
@Controller('verticals')
export class VerticalsController {
  constructor(private readonly verticalsService: VerticalsService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create vertical' })
  create(@Body() dto: CreateVerticalDto) {
    return this.verticalsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active verticals' })
  findAll(@Query() pagination: PaginationDto) {
    return this.verticalsService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get vertical detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.verticalsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update vertical' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVerticalDto) {
    return this.verticalsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete vertical' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.verticalsService.remove(id);
  }
}
