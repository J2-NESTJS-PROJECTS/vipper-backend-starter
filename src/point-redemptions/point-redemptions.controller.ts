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
import { CreatePointRedemptionDto } from './dto/create-point-redemption.dto';
import { PointRedemptionResponseDto } from './dto/point-redemption-response.dto';
import { PointRedemptionsService } from './point-redemptions.service';

@ApiTags('points-redeem')
@ApiBearerAuth('access-token')
@ApiSecurity('x-api-key')
@ApiSecurity('x-api-token')
@Controller('points-redeem')
export class PointRedemptionsController {
  constructor(private readonly pointRedemptionsService: PointRedemptionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.API_CLIENT, RoleType.SUPER_ADMIN,RoleType.ADMIN)
  @ApiOperation({ summary: 'Redeem customer points from ecommerce purchase data' })
  @ApiBody({ type: CreatePointRedemptionDto })
  @ApiResponse({ status: 200, description: 'Point redemption processed', type: PointRedemptionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Invalid API credentials or JWT' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 409, description: 'Duplicate orderId with conflicting payload' })
  @ApiResponse({ status: 502, description: 'SAP RFC error' })
  async create(
    @Body() dto: CreatePointRedemptionDto,
    @CurrentUser('id') requestedByUserId?: string,
  ): Promise<PointRedemptionResponseDto> {
    //console.log({dto})
    return this.pointRedemptionsService.create(dto, requestedByUserId);
  }
}
