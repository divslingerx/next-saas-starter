// src/mail/testMailer.ts
import { type Mailer } from "./mailer";

export class TestMailer implements Mailer {
  sent: any[] = [];

  async send({ to, subject, html, text }: Parameters<Mailer["send"]>[0]) {
    this.sent.push({ to, subject, html, text });
  }

  getSent() {
    return this.sent;
  }
}
