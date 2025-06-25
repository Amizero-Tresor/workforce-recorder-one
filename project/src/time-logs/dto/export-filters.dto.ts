import { IsOptional, IsEnum, IsUUID, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LogStatus } from '@prisma/client';

export class ExportFiltersDto {
  @ApiPropertyOptional({
    description: 'Export format',
    enum: ['csv', 'excel'],
    default: 'csv',
  })
  @IsOptional()
  @IsIn(['csv', 'excel'])
  format?: 'csv' | 'excel' = 'csv';

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: LogStatus,
  })
  @IsOptional()
  @IsEnum(LogStatus)
  status?: LogStatus;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}