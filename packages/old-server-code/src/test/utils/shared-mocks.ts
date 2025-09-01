/**
 * Shared Mock Utilities
 * Reuses the mock data generation from our seeding scripts for tests
 */

import { generateMock } from '@anatine/zod-mock';
import { faker } from '@faker-js/faker';
import type { FakerFunction } from '@anatine/zod-mock';
import { z } from 'zod';

// Custom mapper for better mock data - extracted from seed-mock-data.ts
export function customMockMapper(keyName: string, fakerInstance: typeof faker): FakerFunction | undefined {
  const keyToFnMap: Record<string, FakerFunction> = {
    // Company/Client related
    name: fakerInstance.company.name,
    companyname: fakerInstance.company.name,
    company: fakerInstance.company.name,
    domain: () => fakerInstance.internet.domainName().toLowerCase(),
    website: () => `https://${fakerInstance.internet.domainName()}`,
    
    // Contact related
    firstname: fakerInstance.person.firstName,
    lastname: fakerInstance.person.lastName,
    email: () => fakerInstance.internet.email().toLowerCase(),
    phone: fakerInstance.phone.number,
    title: fakerInstance.person.jobTitle,
    jobtitle: fakerInstance.person.jobTitle,
    
    // Address related
    city: fakerInstance.location.city,
    state: fakerInstance.location.state,
    country: () => fakerInstance.location.countryCode(),
    postalcode: fakerInstance.location.zipCode,
    address: fakerInstance.location.streetAddress,
    
    // Business related
    industry: () => faker.helpers.arrayElement([
      'technology', 'healthcare', 'finance', 'education', 'retail', 
      'manufacturing', 'consulting', 'marketing', 'real-estate', 'other'
    ]),
    lifecycle_stage: () => faker.helpers.arrayElement([
      'lead', 'marketing-qualified-lead', 'sales-qualified-lead', 
      'opportunity', 'customer', 'other'
    ]),
    lead_status: () => faker.helpers.arrayElement([
      'new', 'open', 'in-progress', 'connected', 'bad-timing', 'unqualified'
    ]),
    
    // Project related
    description: fakerInstance.lorem.paragraph,
    budget: () => fakerInstance.number.int({ min: 5000, max: 500000 }),
    revenue: () => fakerInstance.number.int({ min: 100000, max: 10000000 }),
    employeecount: () => fakerInstance.number.int({ min: 1, max: 5000 }),
    
    // Generic
    uuid: fakerInstance.string.uuid,
    url: fakerInstance.internet.url,
    image: fakerInstance.image.url,
    boolean: fakerInstance.datatype.boolean,
    datetime: () => fakerInstance.date.recent().toISOString(),
    date: () => fakerInstance.date.recent().toISOString().split('T')[0] as string,
    
    // Status fields
    status: () => faker.helpers.arrayElement(['active', 'inactive', 'archived']),
  };

  return keyToFnMap[keyName.toLowerCase()];
}

// Generate mock data with consistent seeding for tests
export function generateMockData<T>(schema: z.ZodTypeAny, seed?: number): T {
  if (seed) {
    faker.seed(seed);
  }
  
  try {
    const result = generateMock(schema as any, {
      seed: seed,
      mockeryMapper: customMockMapper
    });
    
    // If generateMock fails, fall back to manual generation
    if (!result) {
      return generateManualMockData(schema) as T;
    }
    
    return result;
  } catch (error) {
    console.warn('generateMock failed, falling back to manual generation:', error);
    return generateManualMockData(schema) as T;
  }
}

// Manual fallback for when zod-mock fails
function generateManualMockData(schema: z.ZodTypeAny): any {
  if (schema instanceof z.ZodObject) {
    const result: any = {};
    const shape = schema.shape;
    
    for (const [key, value] of Object.entries(shape)) {
      const mockFn = customMockMapper(key, faker);
      if (mockFn) {
        result[key] = mockFn();
      } else if (value instanceof z.ZodString) {
        result[key] = faker.lorem.words();
      } else if (value instanceof z.ZodNumber) {
        result[key] = faker.number.int();
      } else if (value instanceof z.ZodBoolean) {
        result[key] = faker.datatype.boolean();
      } else if (value instanceof z.ZodArray) {
        result[key] = [faker.lorem.word(), faker.lorem.word()]; // Generate array with 2 items
      } else if (value instanceof z.ZodObject) {
        result[key] = generateManualMockData(value); // Recursively handle nested objects
      } else {
        result[key] = faker.lorem.word();
      }
    }
    
    return result;
  }
  
  return {};
}

// Generate multiple mock records
export function generateMockDataArray<T>(
  schema: z.ZodTypeAny, 
  count: number, 
  baseSeed?: number
): T[] {
  const results: T[] = [];
  
  for (let i = 0; i < count; i++) {
    const seed = baseSeed ? baseSeed + i : undefined;
    results.push(generateMockData<T>(schema, seed));
  }
  
  return results;
}

// Common test data scenarios
export const TestScenarios = {
  // Generate consistent test client for predictable tests
  testClient: (seed = 12345) => generateMockData(z.object({
    name: z.string(),
    email: z.string(),
    domain: z.string(),
    industry: z.string(),
    lifecycle_stage: z.string(),
    lead_status: z.string()
  }), seed),
  
  // Generate test organization
  testOrganization: (seed = 54321) => generateMockData(z.object({
    name: z.string(),
    domain: z.string(),
    industry: z.string()
  }), seed),
  
  // Generate test contact
  testContact: (seed = 11111) => generateMockData(z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string(),
    phone: z.string(),
    title: z.string(),
    company: z.string()
  }), seed)
};

// Mock user with plan for feature testing
export function createMockUserWithPlan(options: { plan: 'freelancer' | 'team' | 'agency' }) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    emailVerified: true,
    image: faker.image.avatar(),
    plan: options.plan
  };
}

// Mock database records with proper IDs and timestamps
export function createMockRecord(properties: Record<string, any>, overrides?: Partial<{
  id: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}>) {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    organizationId: faker.string.uuid(),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    properties,
    ...overrides
  };
}