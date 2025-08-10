import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send email verification email
   * @param email - User's email address
   * @param username - User's username
   * @param token - Verification token
   */
  async sendVerificationEmail(email: string, username: string, token: string) {
    try {
      // In a real implementation, this would use SendGrid or similar service
      // For now, we'll just log the email details
      this.logger.log(
        `Verification email sent to ${email} for user ${username} with token ${token}`,
      );

      // TODO: Implement actual email sending using SendGrid
      // const msg = {
      //   to: email,
      //   from: this.configService.get('SENDGRID_FROM_EMAIL'),
      //   subject: 'Verify your email address',
      //   templateId: 'verification-template-id',
      //   dynamicTemplateData: {
      //     username,
      //     verificationUrl: `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`,
      //   },
      // };

      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email - User's email address
   * @param username - User's username
   * @param token - Reset token
   */
  async sendPasswordResetEmail(email: string, username: string, token: string) {
    try {
      // In a real implementation, this would use SendGrid or similar service
      // For now, we'll just log the email details
      this.logger.log(
        `Password reset email sent to ${email} for user ${username} with token ${token}`,
      );

      // TODO: Implement actual email sending using SendGrid
      // const msg = {
      //   to: email,
      //   from: this.configService.get('SENDGRID_FROM_EMAIL'),
      //   subject: 'Reset your password',
      //   templateId: 'password-reset-template-id',
      //   dynamicTemplateData: {
      //     username,
      //     resetUrl: `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`,
      //   },
      // };

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email
   * @param email - User's email address
   * @param username - User's username
   */
  async sendWelcomeEmail(email: string, username: string) {
    try {
      this.logger.log(`Welcome email sent to ${email} for user ${username}`);

      // TODO: Implement actual email sending using SendGrid
      // const msg = {
      //   to: email,
      //   from: this.configService.get('SENDGRID_FROM_EMAIL'),
      //   subject: 'Welcome to Snapzy!',
      //   templateId: 'welcome-template-id',
      //   dynamicTemplateData: {
      //     username,
      //     loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
      //   },
      // };

      return { success: true, message: 'Welcome email sent' };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }
}