/**
 * Auth DTOs
 * Data Transfer Objects for authentication operations
 */

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface SignInDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface UpdateProfileDto {
  name?: string;
  image?: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
}

export interface SessionDto {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPayloadDto {
  userId: string;
  email: string;
  sessionId: string;
  type: 'access' | 'refresh' | 'email_verification' | 'password_reset';
}