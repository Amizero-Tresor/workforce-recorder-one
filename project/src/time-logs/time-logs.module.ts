import { Module } from '@nestjs/common';
import { TimeLogsService } from './time-logs.service';
import { TimeLogsController } from './time-logs.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [AuditLogsModule, NotificationsModule, CommonModule],
  providers: [TimeLogsService],
  controllers: [TimeLogsController],
  exports: [TimeLogsService],
})
export class TimeLogsModule {}