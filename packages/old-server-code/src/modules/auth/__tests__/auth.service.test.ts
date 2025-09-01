/**
 * Auth Service Tests
 */

import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { 
  AuthenticationException, 
  ConflictException, 
  ValidationException 
} from "@/core/exceptions/base.exception";
import { createTestUser } from "../../../../test/factories/user.factory";

describe("AuthService", () => {
  let AuthService: any;
  let authService: any;
  let mockRepository: any;
  let mockAuth: any;

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      findUserByEmail: mock(() => Promise.resolve(null)),
      findUserById: mock(() => Promise.resolve(null)),
      createUser: mock(() => Promise.resolve(null)),
      updateUser: mock(() => Promise.resolve(null)),
      createSession: mock(() => Promise.resolve(null)),
      findSessionByToken: mock(() => Promise.resolve(null)),
      deleteSession: mock(() => Promise.resolve()),
      deleteUserSessions: mock(() => Promise.resolve()),
      createVerificationToken: mock(() => Promise.resolve(null)),
      useVerificationToken: mock(() => Promise.resolve(null)),
      updatePassword: mock(() => Promise.resolve(null)),
    };

    // Create mock auth
    mockAuth = {
      api: {
        signUpEmail: mock(() => Promise.resolve(null)),
        signInEmail: mock(() => Promise.resolve(null)),
        forgetPassword: mock(() => Promise.resolve()),
        resetPassword: mock(() => Promise.resolve()),
        verifyEmail: mock(() => Promise.resolve()),
        getSession: mock(() => Promise.resolve(null)),
      }
    };

    // Mock the modules
    mock.module("../repositories/auth.repository", () => ({
      AuthRepository: class {
        constructor() {
          return mockRepository;
        }
      }
    }));

    mock.module("@/lib/auth", () => ({
      auth: mockAuth
    }));

    // Now import the AuthService after mocking
    const module = await import("../services/auth.service");
    AuthService = module.AuthService;
    authService = new AuthService();
  });

  describe("signUp", () => {
    it.skipIf(!process.env.TEST_DATABASE_URL)("should successfully sign up a new user", async () => {
      const signUpData = {
        email: "test@example.com",
        password: "Test123!@#",
        name: "Test User",
      };

      // Mock repository to return no existing user
      mockRepository.findUserByEmail = mock(() => Promise.resolve(null));

      // Mock Better Auth signup
      const mockAuthResult = {
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

      mockAuth.api.signUpEmail = mock(() => Promise.resolve(mockAuthResult));

      const result = await authService.signUp(signUpData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(signUpData.email);
      expect(result.session.token).toBeDefined();
    });

    it("should throw ConflictException if user already exists", async () => {
      const existingUser = createTestUser();
      mockRepository.findUserByEmail = mock(() => Promise.resolve(existingUser));

      expect(async () => {
        await authService.signUp({
          email: existingUser.email!,
          password: "Test123!@#",
          name: "Test User",
        });
      }).toThrow(ConflictException);
    });

    it("should validate password strength", async () => {
      mockRepository.findUserByEmail = mock(() => Promise.resolve(null));

      const weakPasswords = [
        "short",          // Too short
        "nouppercase1!",  // No uppercase
        "NOLOWERCASE1!",  // No lowercase
        "NoNumbers!",     // No numbers
        "NoSpecial123",   // No special characters
      ];

      for (const password of weakPasswords) {
        expect(async () => {
          await authService.signUp({
            email: "test@example.com",
            password,
            name: "Test User",
          });
        }).toThrow(ValidationException);
      }
    });
  });

  describe("signIn", () => {
    it("should successfully sign in an existing user", async () => {
      const existingUser = createTestUser();
      mockRepository.findUserByEmail = mock(() => Promise.resolve(existingUser));

      const mockAuthResult = {
        user: existingUser,
        session: {
          token: "session-token",
          expiresAt: new Date(Date.now() + 86400000),
        }
      };

      mockAuth.api.signInEmail = mock(() => Promise.resolve(mockAuthResult));

      const result = await authService.signIn({
        email: existingUser.email!,
        password: "Test123!@#",
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe(existingUser.email);
      expect(result.session.token).toBeDefined();
    });

    it("should throw AuthenticationException for non-existent user", async () => {
      mockRepository.findUserByEmail = mock(() => Promise.resolve(null));

      expect(async () => {
        await authService.signIn({
          email: "nonexistent@example.com",
          password: "Test123!@#",
        });
      }).toThrow(AuthenticationException);
    });
  });

  describe("validateSession", () => {
    it("should return user and session for valid token", async () => {
      const testUser = createTestUser();
      const mockSession = {
        id: "session-123",
        userId: testUser.id,
        token: "valid-token",
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockRepository.findSessionByToken = mock(() => Promise.resolve(mockSession));
      mockRepository.findUserById = mock(() => Promise.resolve(testUser));

      const result = await authService.validateSession("valid-token");

      expect(result).toBeDefined();
      expect(result?.user.id).toBe(testUser.id);
      expect(result?.session.id).toBe(mockSession.id);
    });

    it("should return null for invalid token", async () => {
      mockRepository.findSessionByToken = mock(() => Promise.resolve(null));

      const result = await authService.validateSession("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null if user not found", async () => {
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockRepository.findSessionByToken = mock(() => Promise.resolve(mockSession));
      mockRepository.findUserById = mock(() => Promise.resolve(null));

      const result = await authService.validateSession("valid-token");

      expect(result).toBeNull();
    });
  });

  describe("forgotPassword", () => {
    it("should not throw error for non-existent email", async () => {
      mockRepository.findUserByEmail = mock(() => Promise.resolve(null));

      // Should not throw - returns silently to avoid revealing user existence
      await authService.forgotPassword({ email: "nonexistent@example.com" });
      
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it("should send reset email for existing user", async () => {
      const existingUser = createTestUser();
      mockRepository.findUserByEmail = mock(() => Promise.resolve(existingUser));

      mockAuth.api.forgetPassword = mock(() => Promise.resolve());

      await authService.forgotPassword({ email: existingUser.email! });

      expect(mockAuth.api.forgetPassword).toHaveBeenCalled();
    });
  });

  describe("signOut", () => {
    it("should delete session if it exists", async () => {
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockRepository.findSessionByToken = mock(() => Promise.resolve(mockSession));
      mockRepository.deleteSession = mock(() => Promise.resolve());

      await authService.signOut("valid-token");

      expect(mockRepository.deleteSession).toHaveBeenCalledWith(mockSession.id);
    });

    it("should not throw error for invalid session", async () => {
      mockRepository.findSessionByToken = mock(() => Promise.resolve(null));

      // Should not throw
      await authService.signOut("invalid-token");
      
      expect(true).toBe(true);
    });
  });
});