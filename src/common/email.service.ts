import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send password reset email to user
   * For now, this logs the reset link - in production, this would integrate with an email service
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // In production, this would send an actual email
    // For now, we'll log the reset information
    this.logger.log(`
=== PASSWORD RESET EMAIL ===
To: ${email}
Subject: Reset Your Password - Garnet AI

Hello ${userName || 'User'},

You have requested to reset your password. Please click the link below to set a new password:

${resetLink}

This link will expire in 1 hour for security purposes.

If you didn't request this password reset, please ignore this email.

Best regards,
Garnet AI Team
============================
    `);

    // TODO: In production, implement actual email sending using providers like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
    this.logger.log(`Password reset email would be sent to: ${email}`);
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail(email: string, userName?: string): Promise<void> {
    this.logger.log(`
=== PASSWORD CHANGED CONFIRMATION ===
To: ${email}
Subject: Password Changed Successfully - Garnet AI

Hello ${userName || 'User'},

Your password has been successfully changed. If you didn't make this change, please contact our support team immediately.

Best regards,
Garnet AI Team
=====================================
    `);

    this.logger.log(`Password changed confirmation would be sent to: ${email}`);
  }
} 