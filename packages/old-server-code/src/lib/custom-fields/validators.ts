/**
 * Custom Field Validators
 * Validation logic for JSONB custom fields
 */

import type { FieldDefinition, FieldType } from "./definitions";

export class CustomFieldValidator {
  /**
   * Validate a single field value
   */
  static validateField(value: any, definition: FieldDefinition): { valid: boolean; error?: string } {
    // Check required
    if (definition.required && (value === null || value === undefined || value === "")) {
      return { valid: false, error: `${definition.label} is required` };
    }

    // Skip validation if not required and empty
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    // Type-specific validation
    switch (definition.type) {
      case "text":
        return this.validateText(value, definition);
      case "number":
        return this.validateNumber(value, definition);
      case "date":
        return this.validateDate(value);
      case "select":
        return this.validateSelect(value, definition);
      case "multiselect":
        return this.validateMultiSelect(value, definition);
      case "currency":
        return this.validateCurrency(value);
      case "boolean":
        return this.validateBoolean(value);
      case "email":
        return this.validateEmail(value);
      case "url":
        return this.validateUrl(value);
      case "phone":
        return this.validatePhone(value);
      default:
        return { valid: true };
    }
  }

  /**
   * Validate all custom fields for an entity
   */
  static validateCustomFields(
    customData: Record<string, any>,
    definitions: FieldDefinition[]
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const definition of definitions) {
      const value = customData[definition.key];
      const result = this.validateField(value, definition);
      
      if (!result.valid && result.error) {
        errors[definition.key] = result.error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private static validateText(value: any, definition: FieldDefinition) {
    if (typeof value !== "string") {
      return { valid: false, error: `${definition.label} must be text` };
    }
    if (definition.maxLength && value.length > definition.maxLength) {
      return { valid: false, error: `${definition.label} must be less than ${definition.maxLength} characters` };
    }
    return { valid: true };
  }

  private static validateNumber(value: any, definition: FieldDefinition) {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: `${definition.label} must be a number` };
    }
    if (definition.min !== undefined && num < definition.min) {
      return { valid: false, error: `${definition.label} must be at least ${definition.min}` };
    }
    if (definition.max !== undefined && num > definition.max) {
      return { valid: false, error: `${definition.label} must be at most ${definition.max}` };
    }
    return { valid: true };
  }

  private static validateDate(value: any) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: "Invalid date format" };
    }
    return { valid: true };
  }

  private static validateSelect(value: any, definition: FieldDefinition) {
    if (!definition.options?.includes(value)) {
      return { valid: false, error: `Invalid option for ${definition.label}` };
    }
    return { valid: true };
  }

  private static validateMultiSelect(value: any, definition: FieldDefinition) {
    if (!Array.isArray(value)) {
      return { valid: false, error: `${definition.label} must be an array` };
    }
    for (const item of value) {
      if (!definition.options?.includes(item)) {
        return { valid: false, error: `Invalid option "${item}" for ${definition.label}` };
      }
    }
    return { valid: true };
  }

  private static validateCurrency(value: any) {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: "Invalid currency amount" };
    }
    return { valid: true };
  }

  private static validateBoolean(value: any) {
    if (typeof value !== "boolean") {
      return { valid: false, error: "Must be true or false" };
    }
    return { valid: true };
  }

  private static validateEmail(value: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: "Invalid email address" };
    }
    return { valid: true };
  }

  private static validateUrl(value: any) {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL" };
    }
  }

  private static validatePhone(value: any) {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value) || value.length < 10) {
      return { valid: false, error: "Invalid phone number" };
    }
    return { valid: true };
  }
}

/**
 * Helper to clean/format custom field values before saving
 */
export function sanitizeCustomFields(
  customData: Record<string, any>,
  definitions: FieldDefinition[]
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const definition of definitions) {
    const value = customData[definition.key];
    
    // Skip undefined values
    if (value === undefined) continue;

    // Apply default values
    if ((value === null || value === "") && definition.defaultValue !== undefined) {
      sanitized[definition.key] = definition.defaultValue;
      continue;
    }

    // Type-specific sanitization
    switch (definition.type) {
      case "number":
      case "currency":
        sanitized[definition.key] = value !== null && value !== "" ? Number(value) : null;
        break;
      case "boolean":
        sanitized[definition.key] = Boolean(value);
        break;
      case "date":
        sanitized[definition.key] = value ? new Date(value).toISOString().split("T")[0] : null;
        break;
      case "multiselect":
        sanitized[definition.key] = Array.isArray(value) ? value : [];
        break;
      default:
        sanitized[definition.key] = value;
    }
  }

  return sanitized;
}