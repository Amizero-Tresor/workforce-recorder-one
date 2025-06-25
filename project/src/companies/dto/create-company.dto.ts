import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Solutions',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Corporate ID',
    example: 'uuid',
  })
  @IsUUID()
  corporateId: string;
}