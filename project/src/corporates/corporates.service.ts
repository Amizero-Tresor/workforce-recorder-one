import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { UpdateCorporateDto } from './dto/update-corporate.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class CorporatesService {
  constructor(
    private db: DatabaseService,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    currentUser: any,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [corporates, total] = await Promise.all([
      this.db.corporate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.db.corporate.count(),
    ]);

    return {
      data: corporates,
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

  async findById(id: string) {
    const corporate = await this.db.corporate.findUnique({
      where: { id },
      include: {
        companies: {
          include: {
            _count: {
              select: {
                users: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!corporate) {
      throw new NotFoundException('Corporate not found');
    }

    return corporate;
  }

  async create(currentUser: any, createCorporateDto: CreateCorporateDto) {
    const corporate = await this.db.corporate.create({
      data: createCorporateDto,
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'CREATE_CORPORATE',
      actorId: currentUser.id,
      metadata: {
        corporateId: corporate.id,
        corporateName: corporate.name,
      },
    });

    return corporate;
  }

  async update(currentUser: any, id: string, updateCorporateDto: UpdateCorporateDto) {
    const corporate = await this.findById(id);

    const updatedCorporate = await this.db.corporate.update({
      where: { id },
      data: updateCorporateDto,
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'UPDATE_CORPORATE',
      actorId: currentUser.id,
      metadata: {
        corporateId: id,
        changes: updateCorporateDto,
      },
    });

    return updatedCorporate;
  }
}