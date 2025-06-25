import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'E-commerce Platform',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Building a new e-commerce platform',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Company ID (required for corporate admins)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Project status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}