import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { mockHandlers } from './mocks/handlers';

// MSW Server for API mocking
export const server = setupServer(...mockHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Global test utilities
global.testUtils = {
  // Generate consistent test IDs
  generateId: (prefix: string) => `${prefix}-test-${Date.now()}`,
  
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};