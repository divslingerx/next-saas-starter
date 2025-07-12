// src/mail/index.ts
import { type Mailer } from "./mailer";
import { SESMailer } from "./sesMailer";
import { DevMailer } from "./devMailer";
import { TestMailer } from "./testMailer";

let mailer: Mailer;

switch (process.env.NODE_ENV) {
  case "production":
    mailer = new SESMailer();
    break;
  case "test":
    mailer = new TestMailer();
    break;
  default:
    mailer = new DevMailer();
}

export { mailer };
