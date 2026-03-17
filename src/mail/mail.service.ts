import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const from = this.configService.get<string>('mail.from');
    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Your FX Trading App Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #4F46E5;">${otp}</h1>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}: ${error.message}`);
      // Don't throw - registration should not fail if email fails in dev
      // In production, consider a queue-based retry mechanism
    }
  }
}
