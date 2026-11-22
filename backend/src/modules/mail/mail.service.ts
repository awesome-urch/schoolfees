import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SchoolOwner } from '../../entities/school-owner.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get('SMTP_PORT') || 587),
        secure: Number(this.configService.get('SMTP_PORT')) === 465,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    } else {
      this.logger.warn('SMTP_HOST not configured — outgoing emails are disabled');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Skipped email to ${to} (no SMTP configured): ${subject}`);
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || 'SchoolFees <no-reply@schoolfees.com.ng>',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return false;
    }
  }

  private layout(content: string) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0f2c5c;color:#fff;padding:20px 24px;font-size:18px;font-weight:bold">SchoolFees.com.ng</div>
        <div style="padding:24px;font-size:15px;line-height:1.7;color:#1e293b">${content}</div>
        <div style="padding:14px 24px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">
          Powered by Monola Technologies Limited (RC 765535).
        </div>
      </div>`;
  }

  async sendRegistrationPending(owner: SchoolOwner) {
    const html = this.layout(`
      <p>Dear <b>${owner.fullName || owner.name}</b>,</p>
      <p>Thank you for registering <b>${owner.name}</b> on <b>SchoolFees.com.ng</b>.</p>
      <p>Your account is currently <b>pending approval</b> by the SchoolFees team. Once approved, you will receive another email with your login details and links.</p>
      <p>No action is needed from you right now.</p>
      <p>Regards,<br>SchoolFees Team</p>
    `);
    return this.send(owner.email, 'Registration received — pending approval', html);
  }

  async sendApproved(owner: SchoolOwner, schoolId: number | null) {
    const base = this.configService.get('FRONTEND_URL') || 'https://schoolfees.com.ng';
    const loginLink = `${base}/auth/login`;
    const studentLink = schoolId ? `${base}/student/pay?school=${schoolId}` : `${base}/student/pay`;
    const html = this.layout(`
      <p>Dear <b>${owner.fullName || owner.name}</b>,</p>
      <p>Good news — <b>${owner.name}</b> has been <b>approved</b> on SchoolFees.com.ng.</p>
      <p><b>1. Your admin dashboard</b><br>
        Log in with the email and password you registered with:<br>
        <a href="${loginLink}">${loginLink}</a><br>
        From there you can add students, create fee types and track payments.
      </p>
      <p><b>2. Student payment link</b><br>
        Share this link with students/parents to register their details and pay fees:<br>
        <a href="${studentLink}">${studentLink}</a>
      </p>
      <p>Regards,<br>SchoolFees Team</p>
    `);
    return this.send(owner.email, 'Your school has been approved — SchoolFees.com.ng', html);
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    const html = this.layout(`
      <p>Dear <b>${name}</b>,</p>
      <p>We received a request to reset your SchoolFees password.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a></p>
      <p>Or paste this link in your browser:<br><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in <b>1 hour</b>. If you did not request a reset, you can ignore this email — your password stays the same.</p>
      <p>Regards,<br>SchoolFees Team</p>
    `);
    return this.send(to, 'Reset your SchoolFees password', html);
  }
}
