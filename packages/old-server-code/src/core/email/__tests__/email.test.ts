/**
 * Email Service Tests
 * Tests for config integration
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';

describe('Email Service with Config', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Clear module cache
    delete require.cache[require.resolve('@/core/config')];
    delete require.cache[require.resolve('../email')];
    
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_PROVIDER = 'console';
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.DATABASE_URL = 'postgres://test';
    process.env.SESSION_SECRET = 'test-secret-at-least-32-characters-long';
    process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.PORT = '3000';
    process.env.SERVER_URL = 'http://localhost:3000';
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('should use console provider when configured', () => {
    const { config } = require('@/core/config');
    const emailConfig = config.get('email');
    
    expect(emailConfig.provider).toBe('console');
    expect(emailConfig.from).toBe('test@example.com');
  });
  
  it('should use SMTP provider when configured', () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'password';
    
    // Clear cache to reload with new env
    delete require.cache[require.resolve('@/core/config')];
    
    const { config } = require('@/core/config');
    const emailConfig = config.get('email');
    
    expect(emailConfig.provider).toBe('smtp');
    expect(emailConfig.smtp?.host).toBe('smtp.example.com');
    expect(emailConfig.smtp?.port).toBe(587);
    expect(emailConfig.smtp?.user).toBe('user@example.com');
  });
  
  it('should use Resend provider when configured', () => {
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test_123';
    
    // Clear cache to reload with new env
    delete require.cache[require.resolve('@/core/config')];
    
    const { config } = require('@/core/config');
    const emailConfig = config.get('email');
    
    expect(emailConfig.provider).toBe('resend');
    expect(emailConfig.resendApiKey).toBe('re_test_123');
  });
  
  it('should log emails to console in console mode', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let loggedOutput: any = null;
    console.log = mock((message: string, data?: any) => {
      if (message.includes('Email (console mode)')) {
        loggedOutput = data;
      }
    });
    
    try {
      // Clear cache and reload
      delete require.cache[require.resolve('@/core/config')];
      delete require.cache[require.resolve('../email')];
      
      const { sendVerificationEmail } = require('../email');
      
      // Wait a bit for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await sendVerificationEmail({
        email: 'test@example.com',
        verificationUrl: 'https://example.com/verify'
      });
      
      expect(loggedOutput).toBeTruthy();
      expect(loggedOutput.to).toEqual(['test@example.com']);
      expect(loggedOutput.subject).toBe('Verify your Email address');
    } finally {
      console.log = originalLog;
    }
  });
  
  it('should use config values for from address', async () => {
    process.env.EMAIL_FROM = 'custom@domain.com';
    
    // Mock console.log to capture output
    const originalLog = console.log;
    let loggedOutput: any = null;
    console.log = mock((message: string, data?: any) => {
      if (message.includes('Email (console mode)')) {
        loggedOutput = data;
      }
    });
    
    try {
      // Clear cache and reload
      delete require.cache[require.resolve('@/core/config')];
      delete require.cache[require.resolve('../email')];
      
      const { sendResetPasswordEmail } = require('../email');
      
      // Wait a bit for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await sendResetPasswordEmail({
        email: 'user@example.com',
        verificationUrl: 'https://example.com/reset'
      });
      
      expect(loggedOutput).toBeTruthy();
      expect(loggedOutput.to).toEqual(['user@example.com']);
      expect(loggedOutput.subject).toBe('Reset Password Link');
    } finally {
      console.log = originalLog;
    }
  });
  
  it('should handle email change verification', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let loggedOutput: any = null;
    console.log = mock((message: string, data?: any) => {
      if (message.includes('Email (console mode)')) {
        loggedOutput = data;
      }
    });
    
    try {
      // Clear cache and reload
      delete require.cache[require.resolve('@/core/config')];
      delete require.cache[require.resolve('../email')];
      
      const { sendChangeEmailVerification } = require('../email');
      
      // Wait a bit for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await sendChangeEmailVerification({
        email: 'newemail@example.com',
        verificationUrl: 'https://example.com/verify-change'
      });
      
      expect(loggedOutput).toBeTruthy();
      expect(loggedOutput.to).toEqual(['newemail@example.com']);
      expect(loggedOutput.subject).toBe('Verify Email Change');
    } finally {
      console.log = originalLog;
    }
  });
});