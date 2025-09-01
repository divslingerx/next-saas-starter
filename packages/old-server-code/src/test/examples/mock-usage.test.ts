/**
 * Example Test Using Mock Generators
 * Shows how to use the mock utilities for testing
 */

import { describe, test, expect } from "bun:test";
import { generateMockData, generateMockDataArray, TestScenarios, createMockRecord } from "../utils/shared-mocks";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string(),
  email: z.string(),
  domain: z.string(),
  industry: z.string(),
  lifecycle_stage: z.string(),
  lead_status: z.string(),
});

describe("Mock Generators Example", () => {
  test("should generate consistent test data", () => {
    const client1 = generateMockData(clientSchema, 12345) as any;
    const client2 = generateMockData(clientSchema, 12345) as any;
    
    expect(client1.name).toBe(client2.name); // Same seed = same data
    expect(client1.email).toBe(client2.email);
    expect(client1.lifecycle_stage).toBeDefined();
  });

  test("should generate multiple records", () => {
    const clients = generateMockDataArray(clientSchema, 5, 54321);
    
    expect(clients).toHaveLength(5);
    expect(clients[0]).toHaveProperty("name");
    expect(clients[0]).toHaveProperty("email");
    expect(clients[0]).toHaveProperty("lifecycle_stage");
  });

  test("should use test data scenarios", () => {
    const testClient = TestScenarios.testClient();
    const testContact = TestScenarios.testContact();
    
    expect(testClient).toHaveProperty("name");
    expect(testClient).toHaveProperty("lifecycle_stage");
    expect(testContact).toHaveProperty("firstname");
    expect(testContact).toHaveProperty("lastname");
  });

  test("should generate organization data", () => {
    const orgData = TestScenarios.testOrganization();
    
    expect(orgData).toHaveProperty("name");
    expect(orgData).toHaveProperty("domain");
    expect(orgData).toHaveProperty("industry");
  });

  test("should handle edge cases", () => {
    const minimalSchema = z.object({
      name: z.string()
    });
    const minimalClient = generateMockData(minimalSchema, 99999) as any;
    
    expect(minimalClient).toHaveProperty("name");
    expect(minimalClient.name).toBeDefined();
  });

  test("should generate related data", () => {
    const client = createMockRecord(TestScenarios.testClient(111)) as any;
    const contacts = generateMockDataArray(z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string()
    }), 2, 222);
    
    expect(client).toHaveProperty("id");
    expect(client).toHaveProperty("organizationId");
    expect(client).toHaveProperty("properties");
    expect(contacts).toHaveLength(2);
    contacts.forEach(contact => {
      expect(contact).toHaveProperty("firstname");
      expect(contact).toHaveProperty("lastname");
      expect(contact).toHaveProperty("email");
    });
  });
});