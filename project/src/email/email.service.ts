import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import e from 'express';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SendGrid API key not configured');
    }
  }

  async sendInvitationEmail(email: string, name: string, tempPassword: string) {
    const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL') || `peaceamizero@gmail.com`;
    const appName = this.configService.get('APP_NAME') || 'Workforce Manager';
    const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    console.log('Email:', fromEmail);
    console.log('Email2:', email);

    const msg = {
      to: email,
      from: fromEmail,
      subject: `Welcome to ${appName}`,
      html: this.getInvitationEmailTemplate(name, tempPassword, appUrl, appName),
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, name: string, tempPassword: string) {
    const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL') || 'peaceamizero@gmail.com';
    const appName = this.configService.get('APP_NAME') || 'Workforce Manager';
    const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';

    const msg = {
      to: email,
      from: fromEmail,
      subject: `Password Reset - ${appName}`,
      html: this.getPasswordResetEmailTemplate(name, tempPassword, appUrl, appName),
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  private getInvitationEmailTemplate(name: string, tempPassword: string, appUrl: string, appName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .password { background: #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${appName}</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>You've been invited to join ${appName}. We're excited to have you on board!</p>
            
            <p>Your temporary login credentials are:</p>
            <div class="password">${tempPassword}</div>
            
            <p><strong>Important:</strong> For security reasons, you'll need to change this password when you first log in.</p>
            
            <a href="${appUrl}/auth/login" class="button">Log In Now</a>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact your administrator.</p>
            
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(name: string, tempPassword: string, appUrl: string, appName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .password { background: #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for ${appName}.</p>
            
            <p>Your temporary password is:</p>
            <div class="password">${tempPassword}</div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This temporary password will expire after first use. Please log in and set a new password immediately.
            </div>
            
            <a href="${appUrl}/auth/login" class="button">Log In & Reset Password</a>
            
            <p>If you didn't request this password reset, please contact your administrator immediately.</p>
            
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}