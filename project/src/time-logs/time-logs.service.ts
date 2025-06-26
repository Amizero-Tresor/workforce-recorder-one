import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role, LogStatus } from '@prisma/client';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ExportService } from '../common/services/export.service';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { UpdateTimeLogDto } from './dto/update-time-log.dto';
import { ReviewTimeLogDto } from './dto/review-time-log.dto';
import { TimeLogFiltersDto } from './dto/time-log-filters.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { ExportFiltersDto } from './dto/export-filters.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class TimeLogsService {
  constructor(
    private db: DatabaseService,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService,
    private exportService: ExportService,
  ) {}

  async findAll(
    currentUser: any,
    paginationDto: PaginationDto,
    filtersDto: any,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.WORKER) {
      whereClause.userId = currentUser.id;
    } else if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.user = {
        companyId: currentUser.companyId,
      };
    }

    // Apply additional filters
    if (filtersDto.status) {
      whereClause.status = filtersDto.status;
    }

    if (filtersDto.projectId) {
      whereClause.projectId = filtersDto.projectId;
    }

    if (filtersDto.userId && currentUser.role !== Role.WORKER) {
      whereClause.userId = filtersDto.userId;
    }

    // Handle date filtering - use startTime instead of createdAt
    if (filtersDto.startDate || filtersDto.endDate) {
      whereClause.startTime = {};
      if (filtersDto.startDate) {
        whereClause.startTime.gte = new Date(filtersDto.startDate);
      }
      if (filtersDto.endDate) {
        const endDate = new Date(filtersDto.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        whereClause.startTime.lte = endDate;
      }
    }

    const [timeLogs, total] = await Promise.all([
      this.db.timeLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.db.timeLog.count({ where: whereClause }),
    ]);

    return {
      data: timeLogs,
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

  async exportTimeLogs(
    currentUser: any,
    exportFilters: ExportFiltersDto,
    res: Response,
  ) {
    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.WORKER) {
      whereClause.userId = currentUser.id;
    } else if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.user = {
        companyId: currentUser.companyId,
      };
    }

    // Apply filters
    if (exportFilters.status) {
      whereClause.status = exportFilters.status;
    }

    if (exportFilters.projectId) {
      whereClause.projectId = exportFilters.projectId;
    }

    if (exportFilters.userId && currentUser.role !== Role.WORKER) {
      whereClause.userId = exportFilters.userId;
    }

    if (exportFilters.startDate || exportFilters.endDate) {
      whereClause.startTime = {};
      if (exportFilters.startDate) {
        whereClause.startTime.gte = new Date(exportFilters.startDate);
      }
      if (exportFilters.endDate) {
        const endDate = new Date(exportFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.startTime.lte = endDate;
      }
    }

    const timeLogs = await this.db.timeLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const exportData = timeLogs.map(timeLog => 
      this.exportService.formatTimeLogForExport(timeLog)
    );

    const filename = `time-logs-${new Date().toISOString().split('T')[0]}`;

    if (exportFilters.format === 'excel') {
      return this.exportService.exportToExcel(exportData, filename, res);
    } else {
      return this.exportService.exportToCSV(exportData, filename, res);
    }
  }

  async bulkAction(currentUser: any, bulkActionDto: BulkActionDto) {
    // Check permissions
    if (currentUser.role === Role.WORKER) {
      throw new ForbiddenException('Workers cannot perform bulk actions on time logs');
    }

    // Fetch all time logs to validate permissions
    const timeLogs = await this.db.timeLog.findMany({
      where: {
        id: { in: bulkActionDto.timeLogIds },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyId: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (timeLogs.length !== bulkActionDto.timeLogIds.length) {
      throw new BadRequestException('Some time logs were not found');
    }

    // Check company permissions for company admins
    if (currentUser.role === Role.COMPANY_ADMIN) {
      const invalidLogs = timeLogs.filter(log => log.user.companyId !== currentUser.companyId);
      if (invalidLogs.length > 0) {
        throw new ForbiddenException('You can only review time logs from your company');
      }
    }

    // Perform bulk update
    const updatedTimeLogs = await this.db.timeLog.updateMany({
      where: {
        id: { in: bulkActionDto.timeLogIds },
      },
      data: {
        status: bulkActionDto.action,
        reviewerId: currentUser.id,
        reviewedAt: new Date(),
        feedback: bulkActionDto.feedback,
      },
    });

    // Create notifications for each affected worker
    const notifications = timeLogs.map(timeLog => ({
      userId: timeLog.user.id,
      title: 'Time Log Review',
      message: `Your time log for ${timeLog.project.name} has been ${bulkActionDto.action.toLowerCase()}`,
      type: 'log_status_change',
      metadata: {
        timeLogId: timeLog.id,
        status: bulkActionDto.action,
        feedback: bulkActionDto.feedback,
      },
    }));

    await this.db.notification.createMany({
      data: notifications,
    });

    // Log the bulk action
    await this.auditLogsService.create({
      action: 'BULK_REVIEW_TIME_LOGS',
      actorId: currentUser.id,
      metadata: {
        timeLogIds: bulkActionDto.timeLogIds,
        action: bulkActionDto.action,
        feedback: bulkActionDto.feedback,
        affectedCount: updatedTimeLogs.count,
      },
    });

    return {
      message: `Successfully ${bulkActionDto.action.toLowerCase()} ${updatedTimeLogs.count} time logs`,
      affectedCount: updatedTimeLogs.count,
      action: bulkActionDto.action,
    };
  }

  async findById(id: string) {
    const timeLog = await this.db.timeLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    return timeLog;
  }

  async create(currentUser: any, createTimeLogDto: CreateTimeLogDto) {
    // Verify user has access to the project
    const workerProject = await this.db.workerProject.findFirst({
      where: {
        workerId: currentUser.id,
        projectId: createTimeLogDto.projectId,
      },
    });

    if (!workerProject) {
      throw new ForbiddenException('You are not assigned to this project');
    }

    // Calculate total hours if both start and end times are provided
    let totalHours: number | undefined;
    if (createTimeLogDto.startTime && createTimeLogDto.endTime) {
      const start = new Date(createTimeLogDto.startTime);
      const end = new Date(createTimeLogDto.endTime);
      
      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }
      
      totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    const timeLog = await this.db.timeLog.create({
      data: {
        ...createTimeLogDto,
        userId: currentUser.id,
        totalHours,
      },
      include: {
        project: true,
        user: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'CREATE_TIME_LOG',
      actorId: currentUser.id,
      timeLogId: timeLog.id,
      metadata: {
        projectId: timeLog.projectId,
        totalHours: timeLog.totalHours,
      },
    });

    return timeLog;
  }

  async update(currentUser: any, id: string, updateTimeLogDto: UpdateTimeLogDto) {
    const timeLog = await this.findById(id);

    // Check permissions - allow workers to update their own ongoing time logs for check-out
    if (currentUser.role === Role.WORKER) {
      if (timeLog.userId !== currentUser.id) {
        throw new ForbiddenException('You can only edit your own time logs');
      }
      
      // Allow updating ongoing time logs (for check-out) or rejected/edit-requested logs
      if (timeLog.endTime && timeLog.status !== LogStatus.REJECTED && timeLog.status !== LogStatus.EDIT_REQUESTED) {
        throw new ForbiddenException('You can only edit rejected or edit-requested time logs');
      }
    }

    // Calculate total hours if both start and end times are provided
    let totalHours = timeLog.totalHours;
    if (updateTimeLogDto.startTime && updateTimeLogDto.endTime) {
      const start = new Date(updateTimeLogDto.startTime);
      const end = new Date(updateTimeLogDto.endTime);
      
      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }
      
      totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    } else if (timeLog.startTime && updateTimeLogDto.endTime) {
      // Calculate hours when only end time is being updated (check-out scenario)
      const start = new Date(timeLog.startTime);
      const end = new Date(updateTimeLogDto.endTime);
      
      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }
      
      totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    // Determine new status - only reset to pending if it was rejected or edit-requested
    let newStatus = timeLog.status;
    if (timeLog.status === LogStatus.REJECTED || timeLog.status === LogStatus.EDIT_REQUESTED) {
      newStatus = LogStatus.PENDING;
    }

    const updatedTimeLog = await this.db.timeLog.update({
      where: { id },
      data: {
        ...updateTimeLogDto,
        totalHours,
        status: newStatus,
      },
      include: {
        project: true,
        user: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'UPDATE_TIME_LOG',
      actorId: currentUser.id,
      timeLogId: id,
      metadata: {
        changes: updateTimeLogDto,
        oldStatus: timeLog.status,
        newStatus: newStatus,
      },
    });

    return updatedTimeLog;
  }

  async review(currentUser: any, id: string, reviewDto: ReviewTimeLogDto) {
    const timeLog = await this.findById(id);

    // Check permissions
    if (currentUser.role === Role.WORKER) {
      throw new ForbiddenException('Workers cannot review time logs');
    }

    if (currentUser.role === Role.COMPANY_ADMIN) {
      // Need to get the user's company info for permission check
      const timeLogWithUser = await this.db.timeLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              companyId: true,
            },
          },
        },
      });

      if (timeLogWithUser?.user.companyId !== currentUser.companyId) {
        throw new ForbiddenException('You can only review time logs from your company');
      }
    }

    const updatedTimeLog = await this.db.timeLog.update({
      where: { id },
      data: {
        status: reviewDto.status,
        reviewerId: currentUser.id,
        reviewedAt: new Date(),
        feedback: reviewDto.feedback,
      },
      include: {
        project: true,
        user: true,
        reviewer: true,
      },
    });

    // Create notification for the worker
    await this.notificationsService.create({
      userId: timeLog.userId,
      title: 'Time Log Review',
      message: `Your time log for ${timeLog.project.name} has been ${reviewDto.status.toLowerCase()}`,
      type: 'log_status_change',
      metadata: {
        timeLogId: id,
        status: reviewDto.status,
        feedback: reviewDto.feedback,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'REVIEW_TIME_LOG',
      actorId: currentUser.id,
      timeLogId: id,
      metadata: {
        status: reviewDto.status,
        feedback: reviewDto.feedback,
      },
    });

    return updatedTimeLog;
  }

  async delete(currentUser: any, id: string) {
    const timeLog = await this.findById(id);

    // Check permissions
    if (currentUser.role === Role.WORKER) {
      if (timeLog.userId !== currentUser.id) {
        throw new ForbiddenException('You can only delete your own time logs');
      }
      
      if (timeLog.status === LogStatus.APPROVED) {
        throw new ForbiddenException('Cannot delete approved time logs');
      }
    }

    await this.db.timeLog.delete({
      where: { id },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'DELETE_TIME_LOG',
      actorId: currentUser.id,
      timeLogId: id,
      metadata: {
        deletedLog: {
          projectId: timeLog.projectId,
          totalHours: timeLog.totalHours,
          status: timeLog.status,
        },
      },
    });

    return { message: 'Time log deleted successfully' };
  }

  async getWorkingHoursReport(
    currentUser: any,
    startDate: Date,
    endDate: Date,
    userId?: string,
    projectId?: string,
  ) {
    let whereClause: any = {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      status: LogStatus.APPROVED,
    };

    // Apply role-based filtering
    if (currentUser.role === Role.WORKER) {
      whereClause.userId = currentUser.id;
    } else if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.user = {
        companyId: currentUser.companyId,
      };
    }

    if (userId && currentUser.role !== Role.WORKER) {
      whereClause.userId = userId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const timeLogs = await this.db.timeLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Aggregate data
    const totalHours = timeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
    const totalLogs = timeLogs.length;

    // Group by user
    const userSummary = timeLogs.reduce((acc, log) => {
      const userId = log.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: log.user,
          totalHours: 0,
          totalLogs: 0,
        };
      }
      acc[userId].totalHours += log.totalHours || 0;
      acc[userId].totalLogs += 1;
      return acc;
    }, {});

    // Group by project
    const projectSummary = timeLogs.reduce((acc, log) => {
      const projectId = log.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: log.project,
          totalHours: 0,
          totalLogs: 0,
        };
      }
      acc[projectId].totalHours += log.totalHours || 0;
      acc[projectId].totalLogs += 1;
      return acc;
    }, {});

    return {
      summary: {
        totalHours,
        totalLogs,
        period: {
          startDate,
          endDate,
        },
      },
      userBreakdown: Object.values(userSummary),
      projectBreakdown: Object.values(projectSummary),
      logs: timeLogs,
    };
  }

  async exportWorkingHoursReport(
    currentUser: any,
    startDate: Date,
    endDate: Date,
    userId?: string,
    projectId?: string,
    format: 'csv' | 'excel' = 'csv',
    res?: Response,
  ) {
    const report = await this.getWorkingHoursReport(
      currentUser,
      startDate,
      endDate,
      userId,
      projectId,
    );

    const exportData = report.logs.map(timeLog => 
      this.exportService.formatTimeLogForExport(timeLog)
    );

    const filename = `working-hours-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`;

    if (format === 'excel') {
      return this.exportService.exportToExcel(exportData, filename, res);
    } else {
      return this.exportService.exportToCSV(exportData, filename, res);
    }
  }
}