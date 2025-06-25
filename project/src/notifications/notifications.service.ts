import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private db: DatabaseService) {}

  async create(data: CreateNotificationDto) {
    return this.db.notification.create({
      data,
    });
  }

  async findByUserId(userId: string) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.db.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}