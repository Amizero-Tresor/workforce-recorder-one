import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCorporateDto {
  @ApiProperty({
    description: 'Corporate name',
    example: 'TechCorp Holdings',
  })
  @IsString()
  name: string;
}