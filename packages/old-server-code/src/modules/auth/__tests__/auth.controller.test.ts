/**
 * Auth Controller Tests
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { 
  AuthenticationException, 
  ConflictException, 
  ValidationException 
} from "@/core/exceptions/base.exception";
import { createTestUser } from "../../../../test/factories/user.factory";

// Mock the auth service
mock.module("../services/auth.service", () => ({
  AuthService: mock(() => ({
    signUp: mock(),
    signIn: mock(),
    signOut: mock(),
    validateSession: mock(),
    getCurrentUser: mock(),
    forgotPassword: mock(),
    resetPassword: mock(),
    verifyEmail: mock(),
  }))
}));

describe("AuthController", () => {
  let authController: AuthController;
  let mockService: any;
  let app: Hono;

  beforeEach(() => {
    authController = new AuthController();
    // Get the mocked service instance
    mockService = (authController as any).authService;
    
    // Create a test app with the auth routes
    app = new Hono();
    app.route('/auth', authController.router);
  });

  describe("POST /auth/signup", () => {
    it("should successfully sign up a new user", async () => {
      const signUpData = {
        email: "test@example.com",
        password: "Test123!@#",
        name: "Test User",
      };

      const mockResult = {
        user: {
          id: "user-123",
          email: signUpData.email,
          name: signUpData.name,
          emailVerified: false,
          image: null,
        },
        session: {
          token: "session-token",
          expiresAt: new Date(Date.now() + 86400000),
        }
      };

      mockService.signUp = mock(() => Promise.resolve(mockResult));

      const response = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as any;
      expect(data.user.email).toBe(signUpData.email);
      expect(data.session.token).toBeDefined();
    });

    it("should return 400 for missing fields", async () => {
      const response = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "test@example.com" }), // Missing password and name
      });

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe('Missing required fields');
    });

    it("should handle ConflictException", async () => {
      mockService.signUp = mock(() => 
        Promise.reject(new ConflictException('User already exists'))
      );

      const response = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "existing@example.com",
          password: "Test123!@#",
          name: "Test User",
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json() as any;
      expect(data.error).toBe('User already exists');
    });
  });

  describe("POST /auth/signin", () => {
    it("should successfully sign in a user", async () => {
      const signInData = {
        email: "test@example.com",
        password: "Test123!@#",
      };

      const mockResult = {
        user: createTestUser(),
        session: {
          token: "session-token",
          expiresAt: new Date(Date.now() + 86400000),
        }
      };

      mockService.signIn = mock(() => Promise.resolve(mockResult));

      const response = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInData),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.user.email).toBe(mockResult.user.email);
      
      // Check if session cookie was set
      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('session=session-token');
      expect(setCookie).toContain('HttpOnly');
    });

    it("should return 400 for missing credentials", async () => {
      const response = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "test@example.com" }), // Missing password
      });

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe('Missing email or password');
    });

    it("should handle AuthenticationException", async () => {
      mockService.signIn = mock(() => 
        Promise.reject(new AuthenticationException('Invalid credentials'))
      );

      const response = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe("POST /auth/signout", () => {
    it("should successfully sign out a user", async () => {
      mockService.signOut = mock(() => Promise.resolve());

      const response = await app.request('/auth/signout', {
        method: 'POST',
        headers: { 
          'Cookie': 'session=valid-token'
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      
      // Check if session cookie was cleared
      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('session=;');
      expect(setCookie).toContain('Max-Age=0');
    });

    it("should handle missing session gracefully", async () => {
      const response = await app.request('/auth/signout', {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.success).toBe(true);
    });
  });

  describe("GET /auth/session", () => {
    it("should return valid session", async () => {
      const mockSession = {
        user: createTestUser(),
        session: {
          id: "session-123",
          expiresAt: new Date(Date.now() + 86400000),
        }
      };

      mockService.validateSession = mock(() => Promise.resolve(mockSession));

      const response = await app.request('/auth/session', {
        headers: { 
          'Authorization': 'Bearer valid-token'
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.user.id).toBe(mockSession.user.id);
    });

    it("should return 401 for no session", async () => {
      const response = await app.request('/auth/session');

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('No session');
    });

    it("should return 401 for invalid session", async () => {
      mockService.validateSession = mock(() => Promise.resolve(null));

      const response = await app.request('/auth/session', {
        headers: { 
          'Authorization': 'Bearer invalid-token'
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid session');
    });
  });

  describe("GET /auth/me", () => {
    it("should return current user", async () => {
      const mockUser = createTestUser();
      mockService.getCurrentUser = mock(() => Promise.resolve(mockUser));

      const response = await app.request('/auth/me', {
        headers: { 
          'Authorization': 'Bearer valid-token'
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.id).toBe(mockUser.id);
      expect(data.email).toBe(mockUser.email);
    });

    it("should return 401 for unauthorized", async () => {
      const response = await app.request('/auth/me');

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('Unauthorized');
    });

    it("should handle AuthenticationException", async () => {
      mockService.getCurrentUser = mock(() => 
        Promise.reject(new AuthenticationException('Invalid session'))
      );

      const response = await app.request('/auth/me', {
        headers: { 
          'Authorization': 'Bearer invalid-token'
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid session');
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should return success message", async () => {
      mockService.forgotPassword = mock(() => Promise.resolve());

      const response = await app.request('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.message).toContain('If an account exists');
    });

    it("should return 400 for missing email", async () => {
      const response = await app.request('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe('Email is required');
    });

    it("should return success even for non-existent email", async () => {
      mockService.forgotPassword = mock(() => Promise.resolve());

      const response = await app.request('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "nonexistent@example.com" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.message).toContain('If an account exists');
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should successfully reset password", async () => {
      mockService.resetPassword = mock(() => Promise.resolve());

      const response = await app.request('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: "reset-token",
          newPassword: "NewPass123!@#",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.message).toBe('Password reset successfully');
    });

    it("should return 400 for missing fields", async () => {
      const response = await app.request('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: "reset-token" }), // Missing newPassword
      });

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe('Missing required fields');
    });

    it("should handle ValidationException", async () => {
      mockService.resetPassword = mock(() => 
        Promise.reject(new ValidationException('Invalid or expired token'))
      );

      const response = await app.request('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: "invalid-token",
          newPassword: "NewPass123!@#",
        }),
      });

      expect(response.status).toBe(422);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid or expired token');
    });
  });

  describe("POST /auth/verify-email", () => {
    it("should successfully verify email", async () => {
      mockService.verifyEmail = mock(() => Promise.resolve());

      const response = await app.request('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: "verify-token" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.message).toBe('Email verified successfully');
    });

    it("should return 400 for missing token", async () => {
      const response = await app.request('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe('Token is required');
    });

    it("should handle ValidationException", async () => {
      mockService.verifyEmail = mock(() => 
        Promise.reject(new ValidationException('Invalid or expired token'))
      );

      const response = await app.request('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: "invalid-token" }),
      });

      expect(response.status).toBe(422);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid or expired token');
    });
  });

  describe("getSessionToken", () => {
    it("should extract token from Authorization header", async () => {
      mockService.validateSession = mock(() => Promise.resolve({
        user: createTestUser(),
        session: { id: "session-123", expiresAt: new Date() }
      }));

      const response = await app.request('/auth/session', {
        headers: { 
          'Authorization': 'Bearer token-from-header'
        },
      });

      expect(mockService.validateSession).toHaveBeenCalledWith('token-from-header');
    });

    it("should extract token from Cookie header", async () => {
      mockService.validateSession = mock(() => Promise.resolve({
        user: createTestUser(),
        session: { id: "session-123", expiresAt: new Date() }
      }));

      const response = await app.request('/auth/session', {
        headers: { 
          'Cookie': 'other=value; session=token-from-cookie; another=value'
        },
      });

      expect(mockService.validateSession).toHaveBeenCalledWith('token-from-cookie');
    });
  });
});