// src/mail/devMailer.ts
import { createTransport, type Transporter } from "nodemailer";
import { type Mailer } from "./mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export class DevMailer implements Mailer {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
    });
  }

  async send({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    try {
      const info = (await this.transporter.sendMail({
        from: '"My App (Dev)" <no-reply@example.com>',
        to,
        subject,
        html,
        text,
      })) as SMTPTransport.SentMessageInfo;

      // If you want to log safely:
      if (process.env.DEBUG_MAIL) {
        console.debug("MailHog sent mail:", info.messageId);
      }
    } catch {}
  }
}
