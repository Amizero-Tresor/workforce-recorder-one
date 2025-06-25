import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignWorkersDto } from './dto/assign-workers.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects with pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.projectsService.findAll(currentUser, paginationDto);
  }

  @Get('export')
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Export projects to CSV or Excel' })
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
  async exportProjects(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Res() res: Response,
  ) {
    return this.projectsService.exportProjects(currentUser, format, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Create new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @GetCurrentUser() currentUser: CurrentUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(currentUser, createProjectDto);
  }

  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(currentUser, id, updateProjectDto);
  }

  @Post(':id/assign-workers')
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Assign workers to project' })
  @ApiResponse({ status: 200, description: 'Workers assigned successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async assignWorkers(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() assignWorkersDto: AssignWorkersDto,
  ) {
    return this.projectsService.assignWorkers(currentUser, id, assignWorkersDto);
  }
}