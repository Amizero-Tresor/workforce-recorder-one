import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignWorkersDto {
  @ApiProperty({
    description: 'Array of worker IDs to assign to the project',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  workerIds: string[];
}