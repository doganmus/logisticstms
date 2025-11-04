import { Injectable, Logger } from '@nestjs/common';

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  template: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: any | null = null;
  private nodemailer: any | null = null;

  private isTransportEnabled(): boolean {
    return Boolean(process.env.SMTP_HOST);
  }

  private async ensureTransporter(): Promise<any> {
    if (!this.transporter) {
      if (!this.nodemailer) {
        try {
          // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
          this.nodemailer = require('nodemailer');
        } catch (error) {
          this.logger.warn(
            'nodemailer paketi kurulu değil. SMTP yapılandırması yok sayılacak, log çıktısı kullanılacak.',
          );
          this.transporter = {
            sendMail: async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
              this.logger.log(`(fallback) mail -> ${to} | ${subject}`);
              this.logger.debug(html);
            },
          };
          return this.transporter;
        }
      }

      this.transporter = this.nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD
            ? {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
              }
            : undefined,
      });
    }
    return this.transporter;
  }

  async sendMail(payload: MailPayload): Promise<void> {
    if (!this.isTransportEnabled()) {
      this.logger.log(
        `Mail disabled. Template=${payload.template} to=${payload.to} subject=${payload.subject}`,
      );
      this.logger.debug(payload.html);
      return;
    }

    const transporter = await this.ensureTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'LogisticsTMS <no-reply@logisticstms.local>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  }
}
