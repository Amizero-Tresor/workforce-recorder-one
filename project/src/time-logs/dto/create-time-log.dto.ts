import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeLogDto {
  @ApiProperty({
    description: 'Project ID',
    example: 'uuid',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Start time',
    example: '2024-01-15T09:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({
    description: 'End time (optional for ongoing work)',
    example: '2024-01-15T17:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Work description',
    example: 'Worked on user authentication module',
  })
  @IsOptional()
  @IsString()
  description?: string;
}