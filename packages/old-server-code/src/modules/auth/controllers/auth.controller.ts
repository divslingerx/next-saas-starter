/**
 * Auth Controller
 * HTTP handlers for authentication endpoints
 */

import { Hono } from "hono";
import type { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { BaseException } from "@/core/exceptions/base.exception";
import type { 
  SignUpDto, 
  SignInDto, 
  ForgotPasswordDto, 
  ResetPasswordDto 
} from "../dto/auth.dto";

export class AuthController {
  private authService: AuthService;
  public router: Hono;

  constructor() {
    this.authService = new AuthService();
    this.router = new Hono();
    this.setupRoutes();
  }

  /**
   * Setup routes
   */
  private setupRoutes() {
    this.router.post('/signup', this.signUp.bind(this));
    this.router.post('/signin', this.signIn.bind(this));
    this.router.post('/signout', this.signOut.bind(this));
    this.router.get('/session', this.getSession.bind(this));
    this.router.post('/forgot-password', this.forgotPassword.bind(this));
    this.router.post('/reset-password', this.resetPassword.bind(this));
    this.router.post('/verify-email', this.verifyEmail.bind(this));
    this.router.get('/me', this.getCurrentUser.bind(this));
  }

  /**
   * Sign up handler
   */
  async signUp(c: Context) {
    try {
      const body = await c.req.json<SignUpDto>();
      
      // Validate input
      if (!body.email || !body.password || !body.name) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      const result = await this.authService.signUp(body);
      return c.json(result, 201);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Sign in handler
   */
  async signIn(c: Context) {
    try {
      const body = await c.req.json<SignInDto>();
      
      // Validate input
      if (!body.email || !body.password) {
        return c.json({ error: 'Missing email or password' }, 400);
      }

      const result = await this.authService.signIn(body);
      
      // Set session cookie
      c.header('Set-Cookie', `session=${result.session.token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 7}`);
      
      return c.json(result);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Sign out handler
   */
  async signOut(c: Context) {
    try {
      const sessionToken = this.getSessionToken(c);
      
      if (sessionToken) {
        await this.authService.signOut(sessionToken);
      }
      
      // Clear session cookie
      c.header('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
      
      return c.json({ success: true });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get session handler
   */
  async getSession(c: Context) {
    try {
      const sessionToken = this.getSessionToken(c);
      
      if (!sessionToken) {
        return c.json({ error: 'No session' }, 401);
      }

      const session = await this.authService.validateSession(sessionToken);
      
      if (!session) {
        return c.json({ error: 'Invalid session' }, 401);
      }

      return c.json(session);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get current user handler
   */
  async getCurrentUser(c: Context) {
    try {
      const sessionToken = this.getSessionToken(c);
      
      if (!sessionToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const user = await this.authService.getCurrentUser(sessionToken);
      return c.json(user);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Forgot password handler
   */
  async forgotPassword(c: Context) {
    try {
      const body = await c.req.json<ForgotPasswordDto>();
      
      if (!body.email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      await this.authService.forgotPassword(body);
      
      // Always return success to avoid revealing user existence
      return c.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Reset password handler
   */
  async resetPassword(c: Context) {
    try {
      const body = await c.req.json<ResetPasswordDto>();
      
      if (!body.token || !body.newPassword) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      await this.authService.resetPassword(body);
      return c.json({ message: 'Password reset successfully' });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Verify email handler
   */
  async verifyEmail(c: Context) {
    try {
      const { token } = await c.req.json<{ token: string }>();
      
      if (!token) {
        return c.json({ error: 'Token is required' }, 400);
      }

      await this.authService.verifyEmail(token);
      return c.json({ message: 'Email verified successfully' });
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get session token from request
   */
  private getSessionToken(c: Context): string | null {
    // Check Authorization header
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookie
    const cookie = c.req.header('Cookie');
    if (cookie) {
      const sessionCookie = cookie.split(';')
        .find(c => c.trim().startsWith('session='));
      if (sessionCookie) {
        return sessionCookie.split('=')[1] || null;
      }
    }

    return null;
  }

  /**
   * Handle errors
   */
  private handleError(c: Context, error: unknown) {
    if (error instanceof BaseException) {
      return c.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details 
        }, 
        error.statusCode as any
      );
    }

    console.error('Unhandled error:', error);
    return c.json(
      { error: 'Internal server error' }, 
      500
    );
  }
}