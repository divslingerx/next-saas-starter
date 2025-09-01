import { BaseConnector } from '../core/BaseConnector';
import type { ServiceMetadata } from '../types';
import { z } from 'zod';

// WordPress specific configuration schema
export const wordpressConfigSchema = z.object({
  baseUrl: z.string().url(),
  username: z.string(),
  applicationPassword: z.string(),
  apiVersion: z.enum(['v2', 'v1']).default('v2'),
  syncPosts: z.boolean().default(true),
  syncPages: z.boolean().default(true),
  syncMedia: z.boolean().default(true),
  syncUsers: z.boolean().default(false),
  syncComments: z.boolean().default(true),
  customPostTypes: z.array(z.string()).optional(),
});

export type WordPressConfig = z.infer<typeof wordpressConfigSchema>;

export class WordPressConnector extends BaseConnector {
  readonly serviceName = 'WordPress';
  readonly authMethod = 'basic' as const;
  readonly scopes = undefined; // Basic auth doesn't use scopes
  readonly oauth2Config = undefined; // Not an OAuth2 connector

  static metadata = {
    name: 'WordPress',
    description: 'Connect to WordPress sites using Application Passwords',
    icon: 'wordpress',
    authMethod: 'basic' as const,
    configSchema: wordpressConfigSchema,
    documentationUrl: 'https://developer.wordpress.org/rest-api/',
    capabilities: ['posts', 'pages', 'media', 'users', 'comments', 'custom-post-types', 'webhooks'],
  };

  private get config(): WordPressConfig {
    const parsed = wordpressConfigSchema.safeParse(this.connection.config || {});
    if (!parsed.success) {
      throw new Error('WordPress configuration is invalid');
    }
    return parsed.data;
  }

  private get authHeader(): string {
    const { username, applicationPassword } = this.config;
    const credentials = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeWordPressRequest('/wp-json/wp/v2/users/me');
      return response.ok;
    } catch {
      return false;
    }
  }

  async getMetadata(): Promise<ServiceMetadata> {
    try {
      // Get current user info
      const userResponse = await this.makeWordPressRequest('/wp-json/wp/v2/users/me');
      const userData = await userResponse.json() as any;

      // Get site info
      const siteResponse = await this.makeWordPressRequest('/wp-json');
      const siteData = await siteResponse.json() as any;

      return {
        serviceName: 'WordPress',
        serviceVersion: this.config.apiVersion,
        accountId: userData.id?.toString(),
        accountName: userData.name || userData.slug,
        permissions: userData.capabilities ? Object.keys(userData.capabilities) : [],
        limits: {
          rateLimit: 60, // WordPress default rate limit per minute
        },
        lastSync: this.connection.updatedAt,
        syncStatus: 'active',
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error}`);
    }
  }

  // WordPress-specific methods
  private async makeWordPressRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', this.authHeader);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      throw new Error('WordPress authentication failed');
    }

    return response;
  }

  async getPosts(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    categories?: number[];
    tags?: number[];
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await this.makeWordPressRequest(
      `/wp-json/wp/v2/posts?${queryParams}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      total: parseInt(response.headers.get('X-WP-Total') || '0'),
      totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '0'),
    };
  }

  async getPost(id: number) {
    const response = await this.makeWordPressRequest(`/wp-json/wp/v2/posts/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json();
  }

  async createPost(post: {
    title: string;
    content: string;
    status?: 'publish' | 'draft' | 'pending' | 'private';
    categories?: number[];
    tags?: number[];
    featured_media?: number;
    meta?: Record<string, any>;
  }) {
    const response = await this.makeWordPressRequest('/wp-json/wp/v2/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create post: ${error}`);
    }

    return response.json();
  }

  async updatePost(id: number, updates: Partial<{
    title: string;
    content: string;
    status: string;
    categories: number[];
    tags: number[];
  }>) {
    const response = await this.makeWordPressRequest(`/wp-json/wp/v2/posts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update post: ${error}`);
    }

    return response.json();
  }

  async deletePost(id: number, force: boolean = false) {
    const params = force ? '?force=true' : '';
    const response = await this.makeWordPressRequest(
      `/wp-json/wp/v2/posts/${id}${params}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.statusText}`);
    }

    return response.json();
  }

  async getPages(params?: { per_page?: number; page?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await this.makeWordPressRequest(
      `/wp-json/wp/v2/pages?${queryParams}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    return response.json();
  }

  async getMedia(params?: { per_page?: number; page?: number; media_type?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await this.makeWordPressRequest(
      `/wp-json/wp/v2/media?${queryParams}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadMedia(file: File | Blob, metadata?: {
    title?: string;
    caption?: string;
    alt_text?: string;
    description?: string;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
    }

    const response = await this.makeWordPressRequest('/wp-json/wp/v2/media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload media: ${error}`);
    }

    return response.json();
  }

  async getCategories() {
    const response = await this.makeWordPressRequest('/wp-json/wp/v2/categories');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  }

  async getTags() {
    const response = await this.makeWordPressRequest('/wp-json/wp/v2/tags');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    return response.json();
  }

  async getComments(postId?: number) {
    const endpoint = postId 
      ? `/wp-json/wp/v2/comments?post=${postId}`
      : '/wp-json/wp/v2/comments';
    
    const response = await this.makeWordPressRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json();
  }

  async getCustomPostTypes() {
    const response = await this.makeWordPressRequest('/wp-json/wp/v2/types');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post types: ${response.statusText}`);
    }

    return response.json();
  }

  // WordPress doesn't have built-in webhook support, but many plugins add it
  async registerWebhook(events: string[], url: string) {
    // This would require a WordPress plugin like WP Webhooks
    throw new Error('Webhook registration requires a WordPress plugin like WP Webhooks');
  }
}