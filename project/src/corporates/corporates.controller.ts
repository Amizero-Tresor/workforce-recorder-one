import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CorporatesService } from './corporates.service';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { UpdateCorporateDto } from './dto/update-corporate.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Corporates')
@Controller('corporates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CorporatesController {
  constructor(private corporatesService: CorporatesService) {}

  @Get()
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Get all corporates with pagination' })
  @ApiResponse({ status: 200, description: 'Corporates retrieved successfully' })
  async findAll(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.corporatesService.findAll(currentUser, paginationDto);
  }

  @Get(':id')
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Get corporate by ID' })
  @ApiResponse({ status: 200, description: 'Corporate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Corporate not found' })
  async findOne(@Param('id') id: string) {
    return this.corporatesService.findById(id);
  }

  @Post()
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Create new corporate' })
  @ApiResponse({ status: 201, description: 'Corporate created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @GetCurrentUser() currentUser: CurrentUser,
    @Body() createCorporateDto: CreateCorporateDto,
  ) {
    return this.corporatesService.create(currentUser, createCorporateDto);
  }

  @Put(':id')
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Update corporate' })
  @ApiResponse({ status: 200, description: 'Corporate updated successfully' })
  @ApiResponse({ status: 404, description: 'Corporate not found' })
  async update(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() updateCorporateDto: UpdateCorporateDto,
  ) {
    return this.corporatesService.update(currentUser, id, updateCorporateDto);
  }
}