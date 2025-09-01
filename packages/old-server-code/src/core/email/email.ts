import { render } from "@react-email/render";
import * as nodemailer from "nodemailer";
import { config } from "@/core/config";
import {
  ChangeEmailVerificationTemplate,
  ResetPasswordEmailTemplate,
  VerificationEmailTemplate,
} from "./email-templates";

// Email interface for consistent API
interface EmailOptions {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  react?: any;
}

// Email provider abstraction
class EmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private resend: any = null;
  private emailConfig = config.get('email');
  private isProduction = config.isProduction();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const provider = this.emailConfig.provider;

    if (provider === 'resend' && this.emailConfig.resendApiKey) {
      // Dynamically import Resend
      try {
        const { Resend } = await import("resend");
        this.resend = new Resend(this.emailConfig.resendApiKey);
      } catch (err) {
        console.error("Failed to load Resend:", err);
        this.fallbackToConsole();
      }
    } else if (provider === 'smtp' && this.emailConfig.smtp) {
      // Use nodemailer for SMTP
      this.transporter = nodemailer.createTransport({
        host: this.emailConfig.smtp.host || "localhost",
        port: this.emailConfig.smtp.port || 587,
        secure: this.emailConfig.smtp.secure || false,
        auth: this.emailConfig.smtp.user && this.emailConfig.smtp.pass ? {
          user: this.emailConfig.smtp.user,
          pass: this.emailConfig.smtp.pass,
        } : undefined,
        ignoreTLS: !this.emailConfig.smtp.secure,
      });
    } else {
      // Console provider (development/testing)
      this.fallbackToConsole();
    }
  }

  private fallbackToConsole() {
    // Set up console logging for emails
    this.transporter = null;
    this.resend = null;
  }

  async send(options: EmailOptions) {
    const provider = this.emailConfig.provider;
    
    if (provider === 'resend' && this.resend) {
      // Use Resend
      return await this.resend.emails.send({
        from: options.from || this.emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        react: options.react,
      });
    } else if (provider === 'smtp' && this.transporter) {
      // Use SMTP
      const html = options.html || (options.react ? await render(options.react) : "");
      
      return await this.transporter.sendMail({
        from: options.from || this.emailConfig.from,
        to: options.to.join(", "),
        subject: options.subject,
        html,
      });
    } else {
      // Console provider - just log the email
      const html = options.html || (options.react ? await render(options.react) : "");
      
      console.log("📧 Email (console mode):", {
        to: options.to,
        subject: options.subject,
        preview: html.substring(0, 100) + "...",
      });
      
      return { id: "mock-email-id", message: "Email logged to console" };
    }
  }
}

// Create singleton instance
const emailProvider = new EmailProvider();

export const sendVerificationEmail = async ({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) => {
  const html = await render(
    VerificationEmailTemplate({ inviteLink: verificationUrl })
  );
  
  const emailConfig = config.get('email');
  return await emailProvider.send({
    from: emailConfig.from,
    to: [email],
    subject: "Verify your Email address",
    html,
  });
};

export const sendResetPasswordEmail = async ({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) => {
  const html = await render(
    ResetPasswordEmailTemplate({ inviteLink: verificationUrl })
  );
  
  const emailConfig = config.get('email');
  return await emailProvider.send({
    from: emailConfig.from,
    to: [email],
    subject: "Reset Password Link",
    html,
  });
};

export const sendChangeEmailVerification = async ({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) => {
  const html = await render(
    ChangeEmailVerificationTemplate({ inviteLink: verificationUrl })
  );
  
  const emailConfig = config.get('email');
  return await emailProvider.send({
    from: emailConfig.from,
    to: [email],
    subject: "Verify Email Change",
    html,
  });
};
