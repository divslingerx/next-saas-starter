// src/mail/sesMailer.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { type Mailer } from "./mailer";

export class SESMailer implements Mailer {
  private client: SESClient;

  constructor() {
    this.client = new SESClient({ region: process.env.AWS_REGION! });
  }

  async send({ to, subject, html, text }: Parameters<Mailer["send"]>[0]) {
    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Body: {
          Html: { Data: html ?? "" },
          Text: { Data: text ?? "" },
        },
        Subject: { Data: subject },
      },
      Source: process.env.MAIL_FROM!,
    };
    await this.client.send(new SendEmailCommand(params));
  }
}
