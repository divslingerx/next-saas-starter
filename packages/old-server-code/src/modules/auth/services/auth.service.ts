/**
 * Auth Service
 * Business logic for authentication operations
 */

import { auth } from "@/lib/auth";
import { AuthRepository } from "../repositories/auth.repository";
import { config } from "@/core/config";
import { 
  AuthenticationException, 
  ValidationException, 
  ConflictException,
  NotFoundException 
} from "@/core/exceptions/base.exception";
import type { 
  SignUpDto, 
  SignInDto, 
  AuthResponseDto,
  ResetPasswordDto,
  ForgotPasswordDto
} from "../dto/auth.dto";

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    this.validatePassword(data.password);

    try {
      // Use Better Auth's signup method
      const result = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        }
      });

      if (!result) {
        throw new Error('Failed to create user');
      }

      return this.formatAuthResponse(result);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new AuthenticationException('Failed to sign up');
    }
  }

  /**
   * Sign in a user
   */
  async signIn(data: SignInDto): Promise<AuthResponseDto> {
    // Check if user exists
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (!existingUser) {
      throw new AuthenticationException('Invalid credentials');
    }

    try {
      // Use Better Auth's signin method
      const result = await auth.api.signInEmail({
        body: {
          email: data.email,
          password: data.password,
        }
      });

      if (!result) {
        throw new AuthenticationException('Invalid credentials');
      }

      return this.formatAuthResponse(result);
    } catch (error) {
      throw new AuthenticationException('Invalid credentials');
    }
  }

  /**
   * Sign out a user
   */
  async signOut(sessionToken: string): Promise<void> {
    const session = await this.authRepository.findSessionByToken(sessionToken);
    if (session) {
      await this.authRepository.deleteSession(session.id);
    }
  }

  /**
   * Get current user from session
   */
  async getCurrentUser(sessionToken: string) {
    const session = await this.authRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new AuthenticationException('Invalid session');
    }

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      throw new AuthenticationException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      image: user.image,
    };
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const user = await this.authRepository.findUserByEmail(data.email);
    
    // Don't reveal if user exists or not
    if (!user) {
      return;
    }

    try {
      await auth.api.forgetPassword({
        body: {
          email: data.email,
          redirectTo: `${config.get('auth').trustedOrigins[0] || 'http://localhost:5173'}/reset-password`,
        }
      });
    } catch (error) {
      // Log error but don't throw to avoid revealing user existence
      console.error('Failed to send password reset email:', error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    this.validatePassword(data.newPassword);

    try {
      await auth.api.resetPassword({
        body: {
          token: data.token,
          newPassword: data.newPassword,
        }
      });
    } catch (error) {
      throw new ValidationException('Invalid or expired reset token');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await auth.api.verifyEmail({
        query: { token }
      });
    } catch (error) {
      throw new ValidationException('Invalid or expired verification token');
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string) {
    const session = await this.authRepository.findSessionByToken(token);
    if (!session) {
      return null;
    }

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      }
    };
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationException('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationException('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new ValidationException('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new ValidationException('Password must contain at least one number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      throw new ValidationException('Password must contain at least one special character');
    }
  }

  /**
   * Format auth response
   */
  private formatAuthResponse(authResult: any): AuthResponseDto {
    return {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        emailVerified: authResult.user.emailVerified,
        image: authResult.user.image,
      },
      session: {
        token: authResult.session.token,
        expiresAt: new Date(authResult.session.expiresAt),
      }
    };
  }
}