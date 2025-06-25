import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogStatus } from '@prisma/client';

export class BulkActionDto {
  @ApiProperty({
    description: 'Array of time log IDs to perform action on',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  timeLogIds: string[];

  @ApiProperty({
    description: 'Action to perform',
    enum: [LogStatus.APPROVED, LogStatus.REJECTED, LogStatus.EDIT_REQUESTED],
    example: LogStatus.APPROVED,
  })
  @IsEnum([LogStatus.APPROVED, LogStatus.REJECTED, LogStatus.EDIT_REQUESTED])
  action: LogStatus;

  @ApiPropertyOptional({
    description: 'Feedback for the workers (optional)',
    example: 'Please provide more details about the work done',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}