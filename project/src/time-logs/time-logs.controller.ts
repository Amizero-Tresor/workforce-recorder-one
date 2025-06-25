import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { LogStatus } from '@prisma/client';
import { TimeLogsService } from './time-logs.service';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { UpdateTimeLogDto } from './dto/update-time-log.dto';
import { ReviewTimeLogDto } from './dto/review-time-log.dto';
import { TimeLogFiltersDto } from './dto/time-log-filters.dto';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { ExportFiltersDto } from './dto/export-filters.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Time Logs')
@Controller('time-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TimeLogsController {
  constructor(private timeLogsService: TimeLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get time logs with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Time logs retrieved successfully' })
  async findAll(
    @GetCurrentUser() currentUser: CurrentUser,
     @Query() query: ReportQueryDto,
  ) {
    return this.timeLogsService.findAll(
      currentUser,
      { page: query.page, limit: query.limit },
      query,
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Export time logs to CSV or Excel' })
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
  async exportTimeLogs(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() exportFilters: ExportFiltersDto,
    @Res() res: Response,
  ) {
    return this.timeLogsService.exportTimeLogs(currentUser, exportFilters, res);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get working hours report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async getReport(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() reportFilters: ReportFiltersDto,
  ) {
    return this.timeLogsService.getWorkingHoursReport(
      currentUser,
      new Date(reportFilters.startDate),
      new Date(reportFilters.endDate),
      reportFilters.userId,
      reportFilters.projectId,
    );
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Export working hours report to CSV or Excel' })
  @ApiResponse({ 
    status: 200, 
    description: 'Report exported successfully',
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
  async exportReport(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() reportFilters: ReportFiltersDto,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Res() res: Response,
  ) {
    return this.timeLogsService.exportWorkingHoursReport(
      currentUser,
      new Date(reportFilters.startDate),
      new Date(reportFilters.endDate),
      reportFilters.userId,
      reportFilters.projectId,
      format,
      res,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time log by ID' })
  @ApiResponse({ status: 200, description: 'Time log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Time log not found' })
  async findOne(@Param('id') id: string) {
    return this.timeLogsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new time log' })
  @ApiResponse({ status: 201, description: 'Time log created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @GetCurrentUser() currentUser: CurrentUser,
    @Body() createTimeLogDto: CreateTimeLogDto,
  ) {
    return this.timeLogsService.create(currentUser, createTimeLogDto);
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on multiple time logs (approve/reject/request edit)' })
  @ApiResponse({ status: 200, description: 'Bulk action completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async bulkAction(
    @GetCurrentUser() currentUser: CurrentUser,
    @Body() bulkActionDto: BulkActionDto,
  ) {
    return this.timeLogsService.bulkAction(currentUser, bulkActionDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update time log' })
  @ApiResponse({ status: 200, description: 'Time log updated successfully' })
  @ApiResponse({ status: 404, description: 'Time log not found' })
  async update(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() updateTimeLogDto: UpdateTimeLogDto,
  ) {
    return this.timeLogsService.update(currentUser, id, updateTimeLogDto);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Review time log (approve/reject/request edit)' })
  @ApiResponse({ status: 200, description: 'Time log reviewed successfully' })
  @ApiResponse({ status: 404, description: 'Time log not found' })
  async review(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() reviewDto: ReviewTimeLogDto,
  ) {
    return this.timeLogsService.review(currentUser, id, reviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete time log' })
  @ApiResponse({ status: 200, description: 'Time log deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time log not found' })
  async remove(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.timeLogsService.delete(currentUser, id);
  }
}