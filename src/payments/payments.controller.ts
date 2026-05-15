import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { DatafastWebhookDto } from './dto/datafast-webhook.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(RoleType.CLIENT, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create payment intent prepared for Datafast' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(userId, dto);
  }

  @Get(':id')
  @Roles(RoleType.CLIENT, RoleType.BUSINESS_OWNER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment detail' })
  findOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(userId, id);
  }

  @Public()
  @Post('webhooks/datafast')
  @ApiOperation({ summary: 'Receive Datafast payment webhook' })
  handleDatafastWebhook(@Body() dto: DatafastWebhookDto) {
    return this.paymentsService.handleDatafastWebhook(dto);
  }
}
