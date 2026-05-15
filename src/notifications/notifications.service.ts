import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RegisterNotificationTokenDto } from './dto/register-notification-token.dto';

@Injectable()
export class NotificationsService {
  async registerToken(userId: string, dto: RegisterNotificationTokenDto) {
    throw new NotImplementedException('Notification token registration is not implemented yet');
  }

  async findAll(userId: string, pagination: PaginationDto) {
    throw new NotImplementedException('Notification listing is not implemented yet');
  }

  async markAsRead(userId: string, id: string) {
    throw new NotImplementedException('Notification read status update is not implemented yet');
  }
}
