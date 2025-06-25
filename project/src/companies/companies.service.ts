import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ExportService } from '../common/services/export.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class CompaniesService {
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

    const [companies, total] = await Promise.all([
      this.db.company.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          corporate: true,
          _count: {
            select: {
              users: true,
              projects: true,
            },
          },
        },
      }),
      this.db.company.count(),
    ]);

    return {
      data: companies,
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

  async exportCompanies(
    currentUser: any,
    format: 'csv' | 'excel',
    res: Response,
  ) {
    const companies = await this.db.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        corporate: true,
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
    });

    const exportData = companies.map(company => 
      this.exportService.formatCompanyForExport(company)
    );

    const filename = `companies-${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      return this.exportService.exportToExcel(exportData, filename, res);
    } else {
      return this.exportService.exportToCSV(exportData, filename, res);
    }
  }

  async findById(id: string) {
    const company = await this.db.company.findUnique({
      where: { id },
      include: {
        corporate: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async create(currentUser: any, createCompanyDto: CreateCompanyDto) {
    const company = await this.db.company.create({
      data: createCompanyDto,
      include: {
        corporate: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'CREATE_COMPANY',
      actorId: currentUser.id,
      metadata: {
        companyId: company.id,
        companyName: company.name,
        corporateId: company.corporateId,
      },
    });

    return company;
  }

  async update(currentUser: any, id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findById(id);

    const updatedCompany = await this.db.company.update({
      where: { id },
      data: updateCompanyDto,
      include: {
        corporate: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'UPDATE_COMPANY',
      actorId: currentUser.id,
      metadata: {
        companyId: id,
        changes: updateCompanyDto,
      },
    });

    return updatedCompany;
  }
}