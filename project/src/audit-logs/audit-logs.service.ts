import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface CreateAuditLogDto {
  action: string;
  actorId: string;
  targetId?: string;
  timeLogId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

@Injectable()
export class AuditLogsService {
  constructor(private db: DatabaseService) {}

  async create(data: CreateAuditLogDto) {
    return this.db.auditLog.create({
      data,
    });
  }

  async findAll(filters?: any) {
    return this.db.auditLog.findMany({
      where: filters,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeLog: {
          select: {
            id: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}