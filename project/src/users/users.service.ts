import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ExportService } from '../common/services/export.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private db: DatabaseService,
    private emailService: EmailService,
    private auditLogsService: AuditLogsService,
    private exportService: ExportService
  ) {}

  async findById(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            corporate: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: {
        company: {
          include: {
            corporate: true,
          },
        },
      },
    });
  }

  async findAll(
    currentUser: any,
    paginationDto: PaginationDto,
    role?: Role
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.companyId = currentUser.companyId;
    }

    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          phoneNumber: true,
          createdAt: true,
          lastLoginAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.db.user.count({ where: whereClause }),
    ]);

    return {
      data: users,
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

  async exportUsers(
    currentUser: any,
    format: 'csv' | 'excel',
    role?: Role,
    res?: Response
  ) {
    let whereClause: any = {};

    // Apply role-based filtering
    if (currentUser.role === Role.COMPANY_ADMIN) {
      whereClause.companyId = currentUser.companyId;
    }

    if (role) {
      whereClause.role = role;
    }

    const users = await this.db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneNumber: true,
        createdAt: true,
        lastLoginAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const exportData = users.map((user) =>
      this.exportService.formatUserForExport(user)
    );

    const filename = `users-${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      return this.exportService.exportToExcel(exportData, filename, res);
    } else {
      return this.exportService.exportToCSV(exportData, filename, res);
    }
  }

  async create(currentUser: any, createUserDto: CreateUserDto) {
    // Check permissions
    this.checkCreatePermissions(currentUser, createUserDto.role);

    // Check if email already exists
    const existingUser = await this.db.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Determine company ID based on role and permissions
    let companyId = createUserDto.companyId;
    if (currentUser.role === Role.COMPANY_ADMIN) {
      companyId = currentUser.companyId; // Company admins can only create users in their company
    }

    const user = await this.db.user.create({
      data: {
        ...createUserDto,
        companyId,
        password: hashedPassword,
        isFirstLogin: true,
      },
      include: {
        company: true,
      },
    });

    // Send invitation email
    await this.emailService.sendInvitationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      tempPassword
    );

    // Log the action
    await this.auditLogsService.create({
      action: 'CREATE_USER',
      actorId: currentUser.id,
      targetId: user.id,
      metadata: {
        userRole: user.role,
        companyId: user.companyId,
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(currentUser: any, id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    // Check permissions
    this.checkUpdatePermissions(currentUser, user);

    const updatedUser = await this.db.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        company: true,
      },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'UPDATE_USER',
      actorId: currentUser.id,
      targetId: id,
      metadata: {
        changes: updateUserDto,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateStatus(currentUser: any, id: string, status: UserStatus) {
    const user = await this.findById(id);

    // Check permissions
    this.checkUpdatePermissions(currentUser, user);

    const updatedUser = await this.db.user.update({
      where: { id },
      data: { status },
    });

    // Log the action
    await this.auditLogsService.create({
      action: 'UPDATE_USER_STATUS',
      actorId: currentUser.id,
      targetId: id,
      metadata: {
        newStatus: status,
        oldStatus: user.status,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateFirstLogin(id: string, isFirstLogin: boolean) {
    return this.db.user.update({
      where: { id },
      data: { isFirstLogin },
    });
  }

  async updateLastLogin(id: string) {
    return this.db.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  private checkCreatePermissions(currentUser: any, targetRole: Role) {
    if (currentUser.role === Role.WORKER) {
      throw new ForbiddenException('Staff cannot create users');
    }

    if (currentUser.role === Role.COMPANY_ADMIN) {
      if (targetRole === Role.CORPORATE_ADMIN) {
        throw new ForbiddenException(
          'Company admins cannot create corporate admins'
        );
      }
    }
  }

  private checkUpdatePermissions(currentUser: any, targetUser: any) {
    if (currentUser.role === Role.WORKER) {
      if (currentUser.id !== targetUser.id) {
        throw new ForbiddenException('Staff can only update their own profile');
      }
    }

    if (currentUser.role === Role.COMPANY_ADMIN) {
      if (targetUser.companyId !== currentUser.companyId) {
        throw new ForbiddenException(
          'Company admins can only manage users in their company'
        );
      }
      if (targetUser.role === Role.CORPORATE_ADMIN) {
        throw new ForbiddenException(
          'Company admins cannot manage corporate admins'
        );
      }
    }
  }

  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
