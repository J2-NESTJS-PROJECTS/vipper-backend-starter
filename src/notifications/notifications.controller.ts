import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RegisterNotificationTokenDto } from './dto/register-notification-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@Roles(RoleType.CLIENT, RoleType.BUSINESS_OWNER, RoleType.DRIVER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('tokens')
  @ApiOperation({ summary: 'Register FCM notification token' })
  registerToken(@CurrentUser('id') userId: string, @Body() dto: RegisterNotificationTokenDto) {
    return this.notificationsService.registerToken(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  findAll(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.notificationsService.findAll(userId, pagination);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }
}
