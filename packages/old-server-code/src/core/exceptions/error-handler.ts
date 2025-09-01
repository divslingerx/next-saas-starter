/**
 * Error Handler
 * Centralized error handling for HTTP responses
 */

import type { Context } from "hono";
import { 
  ValidationException, 
  BusinessException, 
  NotFoundException, 
  UnauthorizedException 
} from "./base.exception";

/**
 * Handle errors and return appropriate HTTP responses
 */
export function handleError(c: Context, error: unknown) {
  console.error("[ERROR]", error);

  // Handle known exception types
  if (error instanceof ValidationException) {
    return c.json(
      {
        success: false,
        error: error.message,
        details: error.details,
      },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundException) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      { status: 404 }
    );
  }

  if (error instanceof UnauthorizedException) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      { status: 401 }
    );
  }

  if (error instanceof BusinessException) {
    return c.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 422 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  // Unknown error
  return c.json(
    {
      success: false,
      error: "An unexpected error occurred",
    },
    { status: 500 }
  );
}