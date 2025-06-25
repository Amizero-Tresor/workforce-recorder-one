import { Module } from '@nestjs/common';
import { CorporatesService } from './corporates.service';
import { CorporatesController } from './corporates.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  providers: [CorporatesService],
  controllers: [CorporatesController],
  exports: [CorporatesService],
})
export class CorporatesModule {}