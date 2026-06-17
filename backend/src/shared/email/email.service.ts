import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from: string;

  constructor(private configService: ConfigService) {
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@mechanica.local');

    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025);

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        ignoreTLS: true,
      });
      this.logger.log(`Email service configured: ${host}:${port}`);
    } catch (err) {
      this.logger.warn(`Failed to create email transport: ${(err as Error).message}`);
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not available, OTP ${otp} would be sent to ${to}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Your OTP Code - Mechanica',
        text: `Your one-time password is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Mechanica - OTP Code</h2>
          <p>Your one-time password is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">${otp}</div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email.</p>
        </div>`,
      });
      this.logger.log(`OTP email sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}: ${(err as Error).message}`);
      return false;
    }
  }
}
