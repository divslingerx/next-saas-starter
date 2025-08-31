/**
 * Email types and interfaces
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: string | string[] | EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: string | EmailAddress;
  subject?: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
  tags?: string[];
  category?: EmailCategory;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

export enum EmailCategory {
  AUTH = 'auth',
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
}

export interface EmailResult {
  id: string;
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp: Date;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<EmailResult>;
  sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]>;
  verifyConnection(): Promise<boolean>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: EmailCategory;
  render(data: any): Promise<{
    html: string;
    text?: string;
    subject: string;
  }>;
}