import { Injectable } from '@nestjs/common';
import { Role, LogStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  async getStats(currentUser: any) {
    switch (currentUser.role) {
      case Role.WORKER:
        return this.getWorkerStats(currentUser);
      case Role.COMPANY_ADMIN:
        return this.getCompanyAdminStats(currentUser);
      case Role.CORPORATE_ADMIN:
        return this.getCorporateAdminStats(currentUser);
      default:
        return {};
    }
  }

  private async getWorkerStats(currentUser: any) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalHours,
      approvedLogs,
      rejectedLogs,
      pendingLogs,
      thisWeekHours,
      assignedProjects,
    ] = await Promise.all([
      this.db.timeLog.aggregate({
        where: {
          userId: currentUser.id,
          status: LogStatus.APPROVED,
        },
        _sum: { totalHours: true },
      }),
      this.db.timeLog.count({
        where: {
          userId: currentUser.id,
          status: LogStatus.APPROVED,
        },
      }),
      this.db.timeLog.count({
        where: {
          userId: currentUser.id,
          status: LogStatus.REJECTED,
        },
      }),
      this.db.timeLog.count({
        where: {
          userId: currentUser.id,
          status: LogStatus.PENDING,
        },
      }),
      this.db.timeLog.aggregate({
        where: {
          userId: currentUser.id,
          status: LogStatus.APPROVED,
          createdAt: { gte: weekStart },
        },
        _sum: { totalHours: true },
      }),
      this.db.workerProject.count({
        where: { workerId: currentUser.id },
      }),
    ]);

    return {
      totalHoursWorked: totalHours._sum.totalHours || 0,
      logsApproved: approvedLogs,
      logsRejected: rejectedLogs,
      logsPending: pendingLogs,
      thisWeekHours: thisWeekHours._sum.totalHours || 0,
      assignedProjects,
    };
  }

  private async getCompanyAdminStats(currentUser: any) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalWorkers,
      pendingLogs,
      approvedLogs,
      thisWeekHours,
      activeProjects,
    ] = await Promise.all([
      this.db.user.count({
        where: {
          companyId: currentUser.companyId,
          role: Role.WORKER,
        },
      }),
      this.db.timeLog.count({
        where: {
          user: { companyId: currentUser.companyId },
          status: LogStatus.PENDING,
        },
      }),
      this.db.timeLog.count({
        where: {
          user: { companyId: currentUser.companyId },
          status: LogStatus.APPROVED,
        },
      }),
      this.db.timeLog.aggregate({
        where: {
          user: { companyId: currentUser.companyId },
          status: LogStatus.APPROVED,
          createdAt: { gte: weekStart },
        },
        _sum: { totalHours: true },
      }),
      this.db.project.count({
        where: {
          companyId: currentUser.companyId,
          isActive: true,
        },
      }),
    ]);

    return {
      totalWorkers,
      pendingLogs,
      approvedLogs,
      thisWeekHours: thisWeekHours._sum.totalHours || 0,
      activeProjects,
    };
  }

  private async getCorporateAdminStats(currentUser: any) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalCompanies,
      totalWorkers,
      totalAdmins,
      pendingLogs,
      approvedLogs,
      thisWeekHours,
      activeProjects,
    ] = await Promise.all([
      this.db.company.count(),
      this.db.user.count({
        where: { role: Role.WORKER },
      }),
      this.db.user.count({
        where: { role: Role.COMPANY_ADMIN },
      }),
      this.db.timeLog.count({
        where: { status: LogStatus.PENDING },
      }),
      this.db.timeLog.count({
        where: { status: LogStatus.APPROVED },
      }),
      this.db.timeLog.aggregate({
        where: {
          status: LogStatus.APPROVED,
          createdAt: { gte: weekStart },
        },
        _sum: { totalHours: true },
      }),
      this.db.project.count({
        where: { isActive: true },
      }),
    ]);

    return {
      totalCompanies,
      totalWorkers,
      totalAdmins,
      pendingLogs,
      approvedLogs,
      thisWeekHours: thisWeekHours._sum.totalHours || 0,
      activeProjects,
    };
  }
}