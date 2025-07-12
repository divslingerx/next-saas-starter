// src/mail/mailer.ts
export interface Mailer {
  send(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void>;
}
