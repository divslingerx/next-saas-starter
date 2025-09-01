/**
 * Environment-based Feature Flags
 * These control system-wide features based on environment configuration
 */

import { config } from '../config';

/**
 * Environment-based feature flags
 * These control system-wide features that can be toggled via environment variables
 */
export class EnvironmentFlags {
  /**
   * Check if a system feature is enabled
   */
  static isEnabled(feature: keyof ReturnType<typeof config.get<'features'>>): boolean {
    const features = config.get('features');
    return features[feature] ?? false;
  }
  
  /**
   * Check if maintenance mode is active
   * When active, the application should show a maintenance page
   */
  static isMaintenanceMode(): boolean {
    return this.isEnabled('maintenance');
  }
  
  /**
   * Check if debug mode is active
   * When active, additional logging and debugging information is shown
   */
  static isDebugMode(): boolean {
    return this.isEnabled('debugMode');
  }
  
  /**
   * Check if API documentation is enabled
   * When active, API docs are accessible
   */
  static isApiDocsEnabled(): boolean {
    return this.isEnabled('apiDocs');
  }
  
  /**
   * Check if public signup is allowed
   * When disabled, only invited users can sign up
   */
  static isPublicSignupEnabled(): boolean {
    return this.isEnabled('publicSignup');
  }
  
  /**
   * Check if rate limiting is enabled
   * When disabled, no rate limits are applied (useful for testing)
   */
  static isRateLimitingEnabled(): boolean {
    return this.isEnabled('rateLimiting');
  }
  
  /**
   * Check if logging is enabled
   * When disabled, logs are not written (useful for testing)
   */
  static isLoggingEnabled(): boolean {
    return this.isEnabled('logging');
  }
  
  /**
   * Get all environment flags
   */
  static getAllFlags(): Record<string, boolean> {
    return config.get('features');
  }
  
  /**
   * Check if a service is enabled
   */
  static isServiceEnabled(service: 'wappalyzer' | 'lighthouse' | 'axe'): boolean {
    const services = config.get('services');
    return services[service]?.enabled ?? false;
  }
}