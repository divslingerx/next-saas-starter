import type {
  EmailProvider,
  SendEmailOptions,
  EmailResult,
  EmailTemplate,
  EmailCategory,
} from './types';
import { EmailQueue } from './queue/queue.interface';
import { MemoryQueue } from './queue/memory.queue';
import { templateRegistry } from './templates/registry';

export interface EmailServiceConfig {
  provider: EmailProvider;
  queue?: EmailQueue;
  from?: {
    email: string;
    name: string;
  };
  replyTo?: string;
  appId?: string;
  appName?: string;
}

export class EmailService {
  private provider: EmailProvider;
  private queue: EmailQueue;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.provider = config.provider;
    this.queue = config.queue || new MemoryQueue();
    this.config = config;
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // Apply defaults
      const emailOptions = this.applyDefaults(options);
      
      // Render template if specified
      if (emailOptions.template) {
        const rendered = await this.renderTemplate(
          emailOptions.template,
          emailOptions.data || {}
        );
        emailOptions.html = rendered.html;
        emailOptions.text = rendered.text;
        emailOptions.subject = emailOptions.subject || rendered.subject;
      }

      // Add tracking pixels/links if needed
      if (emailOptions.metadata?.trackOpens) {
        emailOptions.html = this.addOpenTracking(
          emailOptions.html!,
          emailOptions.metadata.emailId
        );
      }

      // Send via provider
      return await this.provider.send(emailOptions);
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]> {
    return await this.provider.sendBatch(
      emails.map(email => this.applyDefaults(email))
    );
  }

  async queue(
    options: SendEmailOptions,
    delay?: number
  ): Promise<string> {
    return await this.queue.add({
      type: 'email',
      payload: this.applyDefaults(options),
      delay,
    });
  }

  async scheduleAt(
    options: SendEmailOptions,
    date: Date
  ): Promise<string> {
    const delay = date.getTime() - Date.now();
    return await this.queue(options, delay);
  }

  async renderTemplate(
    templateId: string,
    data: any
  ): Promise<{ html: string; text?: string; subject: string }> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Add app context to data
    const enrichedData = {
      ...data,
      app: {
        name: this.config.appName,
        id: this.config.appId,
      },
    };

    return await template.render(enrichedData);
  }

  async previewTemplate(
    templateId: string,
    data: any
  ): Promise<string> {
    const rendered = await this.renderTemplate(templateId, data);
    // In production, this would upload to a preview service
    // For now, return a data URL
    return `data:text/html;base64,${Buffer.from(rendered.html).toString('base64')}`;
  }

  async subscribe(email: string, lists: string[]): Promise<void> {
    // Implementation depends on provider
    // Some providers have built-in list management
    console.log(`Subscribing ${email} to lists:`, lists);
  }

  async unsubscribe(email: string, lists?: string[]): Promise<void> {
    // Implementation depends on provider
    console.log(`Unsubscribing ${email} from lists:`, lists);
  }

  async trackOpen(emailId: string): Promise<void> {
    // Record open event
    console.log(`Email opened: ${emailId}`);
  }

  async trackClick(emailId: string, link: string): Promise<void> {
    // Record click event
    console.log(`Link clicked in email ${emailId}: ${link}`);
  }

  private applyDefaults(options: SendEmailOptions): SendEmailOptions {
    return {
      ...options,
      from: options.from || this.config.from,
      replyTo: options.replyTo || this.config.replyTo,
      metadata: {
        ...options.metadata,
        appId: this.config.appId,
        sentAt: new Date().toISOString(),
      },
    };
  }

  private getTemplate(templateId: string): EmailTemplate | null {
    // Check if template exists for this app
    const appTemplates = templateRegistry[this.config.appId || 'default'];
    return appTemplates?.[templateId] || templateRegistry.shared[templateId] || null;
  }

  private addOpenTracking(html: string, emailId: string): string {
    // Add invisible tracking pixel
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open/${emailId}" width="1" height="1" style="display:none;" />`;
    
    // Insert before closing body tag
    return html.replace('</body>', `${trackingPixel}</body>`);
  }

  private wrapClickTracking(html: string, emailId: string): string {
    // Wrap all links with tracking redirects
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/click/${emailId}?url=${encodeURIComponent(url)}`;
        return `href="${trackUrl}"`;
      }
    );
  }
}