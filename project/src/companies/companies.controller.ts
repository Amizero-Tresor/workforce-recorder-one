import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Get all companies with pagination' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async findAll(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.companiesService.findAll(currentUser, paginationDto);
  }

  @Get('export')
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Export companies to CSV or Excel' })
  @ApiResponse({ 
    status: 200, 
    description: 'File exported successfully',
    headers: {
      'Content-Type': {
        description: 'MIME type of the exported file',
        schema: { type: 'string' }
      },
      'Content-Disposition': {
        description: 'Attachment filename',
        schema: { type: 'string' }
      }
    }
  })
  async exportCompanies(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Res() res: Response,
  ) {
    return this.companiesService.exportCompanies(currentUser, format, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Create new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @GetCurrentUser() currentUser: CurrentUser,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companiesService.create(currentUser, createCompanyDto);
  }

  @Put(':id')
  @Roles(Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(currentUser, id, updateCompanyDto);
  }
}