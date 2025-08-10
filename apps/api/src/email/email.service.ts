import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmail(emailData: EmailData): Promise<void> {
    const { to, subject, text, html, from } = emailData;

    // For development, log the email instead of sending
    if (this.configService.nodeEnv === 'development') {
      this.logger.log(`[DEV] Email would be sent to ${to}:`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Text: ${text || 'No text content'}`);
      this.logger.log(`HTML: ${html || 'No HTML content'}`);
      return;
    }

    try {
      // In production, integrate with your email service provider
      // Examples: SendGrid, AWS SES, Nodemailer with SMTP, etc.
      
      // For now, we'll use a placeholder implementation
      // Replace this with your actual email service integration
      
      this.logger.log(`Sending email to ${to}: ${subject}`);
      
      // Example with a hypothetical email service:
      // await this.emailProvider.send({
      //   to,
      //   from: from || this.configService.defaultFromEmail,
      //   subject,
      //   text,
      //   html,
      // });
      
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const welcomeEmail: EmailData = {
      to: email,
      subject: 'Welcome to Snapzy!',
      text: `Welcome to Snapzy, ${username}! We're excited to have you on board.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Snapzy!</h1>
          <p>Hi ${username},</p>
          <p>We're excited to have you join our community! Snapzy is a platform where you can share your moments, connect with friends, and discover amazing content.</p>
          <p>Get started by:</p>
          <ul>
            <li>Completing your profile</li>
            <li>Following friends and interesting accounts</li>
            <li>Sharing your first post or story</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Snapzy Team</p>
        </div>
      `,
    };

    await this.sendEmail(welcomeEmail);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.frontendUrl}/reset-password?token=${resetToken}`;
    
    const resetEmail: EmailData = {
      to: email,
      subject: 'Reset Your Snapzy Password',
      text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>You requested a password reset for your Snapzy account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>The Snapzy Team</p>
        </div>
      `,
    };

    await this.sendEmail(resetEmail);
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.frontendUrl}/verify-email?token=${verificationToken}`;
    
    const verificationEmail: EmailData = {
      to: email,
      subject: 'Verify Your Snapzy Email Address',
      text: `Please verify your email address by clicking this link: ${verificationUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email Address</h1>
          <p>Welcome to Snapzy! Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>The Snapzy Team</p>
        </div>
      `,
    };

    await this.sendEmail(verificationEmail);
  }

  async sendSecurityAlert(email: string, username: string, activity: string): Promise<void> {
    const securityEmail: EmailData = {
      to: email,
      subject: 'Security Alert - Snapzy Account',
      text: `Security alert for your Snapzy account (${username}): ${activity}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">Security Alert</h1>
          <p>Hi ${username},</p>
          <p>We detected unusual activity on your Snapzy account:</p>
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #dc3545;">
            <strong>${activity}</strong>
          </p>
          <p>If this was you, no action is needed. If you don't recognize this activity:</p>
          <ul>
            <li>Change your password immediately</li>
            <li>Enable two-factor authentication</li>
            <li>Contact our support team</li>
          </ul>
          <p>Best regards,<br>The Snapzy Security Team</p>
        </div>
      `,
    };

    await this.sendEmail(securityEmail);
  }

  async sendAccountDeletionConfirmation(email: string, username: string): Promise<void> {
    const deletionEmail: EmailData = {
      to: email,
      subject: 'Snapzy Account Deletion Confirmation',
      text: `Your Snapzy account (${username}) has been successfully deleted.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Account Deletion Confirmation</h1>
          <p>Hi ${username},</p>
          <p>Your Snapzy account has been successfully deleted as requested.</p>
          <p>All your data, including posts, stories, and personal information, has been permanently removed from our systems.</p>
          <p>If you change your mind and want to rejoin Snapzy, you can create a new account at any time.</p>
          <p>Thank you for being part of our community.</p>
          <p>Best regards,<br>The Snapzy Team</p>
        </div>
      `,
    };

    await this.sendEmail(deletionEmail);
  }
}