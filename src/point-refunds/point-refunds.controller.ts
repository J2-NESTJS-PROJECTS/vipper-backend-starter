import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePointRefundDto } from './dto/create-point-refund.dto';
import { PointRefundResponseDto } from './dto/point-refund-response.dto';
import { PointRefundsService } from './point-refunds.service';

@ApiTags('points-refund')
@ApiBearerAuth('access-token')
@ApiSecurity('x-api-key')
@ApiSecurity('x-api-token')
@Controller('points-refund')
export class PointRefundsController {
  constructor(private readonly pointRefundsService: PointRefundsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.API_CLIENT, RoleType.SUPER_ADMIN,RoleType.ADMIN)
  @ApiOperation({ summary: 'Refund customer points back to SAP from ecommerce refund data' })
  @ApiBody({ type: CreatePointRefundDto })
  @ApiResponse({ status: 200, description: 'Point refund processed', type: PointRefundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Invalid API credentials or JWT' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Original point redemption not found' })
  @ApiResponse({ status: 409, description: 'Duplicate refund or invalid refund amount' })
  @ApiResponse({ status: 502, description: 'SAP RFC error' })
  async create(
    @Body() dto: CreatePointRefundDto,
    @CurrentUser('id') requestedByUserId?: string,
  ): Promise<PointRefundResponseDto> {
    return this.pointRefundsService.create(dto, requestedByUserId);
  }
}
