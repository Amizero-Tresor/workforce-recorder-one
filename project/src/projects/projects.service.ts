import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ExportService } from '../common/services/export.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignWorkersDto } from './dto/assign-workers.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private db: DatabaseService,
    private auditLogsService: AuditLogsService,
    private exportService: ExportService,
  ) {}

  async findAll(
    currentUser: any,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.WORKER) {
      whereClause.workerProjects = {
        some: {
          workerId: currentUser.id,
        },
      };
    } else if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.companyId = currentUser.companyId;
    }

    const [projects, total] = await Promise.all([
      this.db.project.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: true,
          _count: {
            select: {
              workerProjects: true,
              timeLogs: true,
            },
          },
        },
      }),
      this.db.project.count({ where: whereClause }),
    ]);

    return {
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async exportProjects(
    currentUser: any,
    format: 'csv' | 'excel',
    res: Response,
  ) {
    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.companyId = currentUser.companyId;
    }

    const projects = await this.db.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        _count: {
          select: {
            workerProjects: true,
            timeLogs: true,
          },
        },
      },
    });

    const exportData = projects.map(project => 
      this.exportService.formatProjectForExport(project)
    );

    const filename = `projects-${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      return this.exportService.exportToExcel(exportData, filename, res);
    } else {
      return this.exportService.exportToCSV(exportData, filename, res);
    }
  }

  async findById(id: string) {
    const project = await this.db.project.findUnique({
      where: { id },
      include: {
        company: true,
        workerProjects: {
          include: {
            worker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        timeLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(currentUser: any, createProjectDto: CreateProjectDto) {
    // Determine company ID based on role
    let companyId = createProjectDto.companyId;
    if (currentUser.role === Role.COMPANY_ADMIN) {
      companyId = currentUser.companyId;
    }

    const project = await this.db.project.create({
      data: {
        ...createProjectDto,
        companyId,
      },
      include: {
        company: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'CREATE_PROJECT',
      actorId: currentUser.id,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        companyId: project.companyId,
      },
    });

    return project;
  }

  async update(currentUser: any, id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findById(id);

    // Check permissions
    if (currentUser.role === Role.COMPANY_ADMIN) {
      if (project.companyId !== currentUser.companyId) {
        throw new ForbiddenException('You can only manage projects in your company');
      }
    }

    const updatedProject = await this.db.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        company: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'UPDATE_PROJECT',
      actorId: currentUser.id,
      metadata: {
        projectId: id,
        changes: updateProjectDto,
      },
    });

    return updatedProject;
  }

  async assignWorkers(currentUser: any, id: string, assignWorkersDto: AssignWorkersDto) {
    const project = await this.findById(id);

    // Check permissions
    if (currentUser.role === Role.COMPANY_ADMIN) {
      if (project.companyId !== currentUser.companyId) {
        throw new ForbiddenException('You can only manage projects in your company');
      }
    }

    // Remove existing assignments
    await this.db.workerProject.deleteMany({
      where: { projectId: id },
    });

    // Create new assignments
    const assignments = assignWorkersDto.workerIds.map(workerId => ({
      projectId: id,
      workerId,
    }));

    await this.db.workerProject.createMany({
      data: assignments,
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'ASSIGN_WORKERS_TO_PROJECT',
      actorId: currentUser.id,
      metadata: {
        projectId: id,
        workerIds: assignWorkersDto.workerIds,
      },
    });

    return { message: 'Workers assigned successfully' };
  }
}