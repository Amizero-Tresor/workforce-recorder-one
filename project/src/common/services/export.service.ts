import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as csvWriter from 'csv-writer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ExportService {
  async exportToCSV(data: any[], filename: string, res: Response) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]).map((key) => ({
      id: key,
      title: this.formatHeader(key),
    }));

    const tempFilePath = path.join(process.cwd(), 'temp', `${filename}.csv`);

    // Ensure temp directory exists
    const tempDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const writer = csvWriter.createObjectCsvWriter({
      path: tempFilePath,
      header: headers,
    });

    await writer.writeRecords(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.csv"`
    );

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlinkSync(tempFilePath);
    });
  }

  async exportToExcel(data: any[], filename: string, res: Response) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = this.calculateColumnWidths(data);
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.xlsx"`
    );

    res.send(buffer);
  }

  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private calculateColumnWidths(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const widths = keys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Cap at 50 characters
    });

    return widths;
  }

  formatTimeLogForExport(timeLog: any) {
    return {
      'Staff Name': `${timeLog.user.firstName} ${timeLog.user.lastName}`,
      'Staff Email': timeLog.user.email,
      Project: timeLog.project.name,
      'Start Time': timeLog.startTime
        ? new Date(timeLog.startTime).toLocaleString()
        : '',
      'End Time': timeLog.endTime
        ? new Date(timeLog.endTime).toLocaleString()
        : '',
      'Total Time': this.formatDuration(timeLog.totalHours || 0),
      Description: timeLog.description || '',
      Status: timeLog.status,
      Reviewer: timeLog.reviewer
        ? `${timeLog.reviewer.firstName} ${timeLog.reviewer.lastName}`
        : '',
    };
  }

  formatUserForExport(user: any) {
    return {
      'User ID': user.id,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      Email: user.email,
      'Phone Number': user.phoneNumber || '',
      Role: user.role,
      Status: user.status,
      Company: user.company?.name || '',
      'Last Login': user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleString()
        : 'Never',
      'Created At': new Date(user.createdAt).toLocaleString(),
    };
  }

  formatProjectForExport(project: any) {
    return {
      'Project ID': project.id,
      Name: project.name,
      Description: project.description || '',
      Company: project.company?.name || '',
      Status: project.isActive ? 'Active' : 'Inactive',
      'Staff Count': project._count?.workerProjects || 0,
      'Time Logs Count': project._count?.timeLogs || 0,
      'Created At': new Date(project.createdAt).toLocaleString(),
    };
  }

  formatCompanyForExport(company: any) {
    return {
      'Company ID': company.id,
      Name: company.name,
      Corporate: company.corporate?.name || '',
      'Users Count': company._count?.users || 0,
      'Projects Count': company._count?.projects || 0,
      'Created At': new Date(company.createdAt).toLocaleString(),
    };
  }

  private formatDuration(totalHours: number): string {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }
}