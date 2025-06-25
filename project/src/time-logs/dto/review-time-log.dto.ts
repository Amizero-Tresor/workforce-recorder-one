import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogStatus } from '@prisma/client';

export class ReviewTimeLogDto {
  @ApiProperty({
    description: 'Review status',
    enum: [LogStatus.APPROVED, LogStatus.REJECTED, LogStatus.EDIT_REQUESTED],
    example: LogStatus.APPROVED,
  })
  @IsEnum([LogStatus.APPROVED, LogStatus.REJECTED, LogStatus.EDIT_REQUESTED])
  status: LogStatus;

  @ApiPropertyOptional({
    description: 'Feedback for the worker',
    example: 'Please provide more details about the work done',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}