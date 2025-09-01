/**
 * BaseRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { BaseRepository } from '../base.repository';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Mock table with proper Drizzle column definitions
const mockTable = pgTable('test_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
});

// Mock entity type
interface TestEntity {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Mock database
const createMockDb = () => {
  const mockResults: any[] = [];
  
  const chainableMethods = {
    select: mock(() => chainableMethods),
    from: mock(() => chainableMethods),
    where: mock(() => chainableMethods),
    limit: mock(() => chainableMethods),
    offset: mock(() => chainableMethods),
    orderBy: mock(() => chainableMethods),
    returning: mock(() => Promise.resolve(mockResults)),
    insert: mock(() => chainableMethods),
    update: mock(() => chainableMethods),
    delete: mock(() => chainableMethods),
    values: mock(() => chainableMethods),
    set: mock(() => chainableMethods),
    then: mock((resolve: any) => resolve(mockResults)),
  };
  
  // Setup mock to return results
  const mockDb = {
    select: mock(() => {
      chainableMethods.then = mock((resolve: any) => resolve(mockResults));
      return chainableMethods;
    }),
    insert: mock(() => {
      chainableMethods.returning = mock(() => Promise.resolve(mockResults));
      return chainableMethods;
    }),
    update: mock(() => {
      chainableMethods.returning = mock(() => Promise.resolve(mockResults));
      return chainableMethods;
    }),
    delete: mock(() => {
      chainableMethods.then = mock((resolve: any) => 
        resolve({ rowCount: mockResults.length })
      );
      return chainableMethods;
    }),
    transaction: mock(async (callback: any) => {
      return await callback(mockDb);
    }),
    setMockResults: (results: any[]) => {
      mockResults.length = 0;
      mockResults.push(...results);
    },
  };
  
  return mockDb;
};

// Test repository implementation
class TestRepository extends BaseRepository<TestEntity> {
  constructor(db: any) {
    super(mockTable as any, db);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockDb: any;
  
  beforeEach(() => {
    mockDb = createMockDb();
    repository = new TestRepository(mockDb);
  });
  
  describe('findById', () => {
    it('should find entity by id', async () => {
      const mockEntity = { id: 1, name: 'Test', email: 'test@example.com', createdAt: new Date() };
      mockDb.setMockResults([mockEntity]);
      
      const result = await repository.findById(1);
      
      expect(result).toEqual(mockEntity);
      expect(mockDb.select).toHaveBeenCalled();
    });
    
    it('should return null if not found', async () => {
      mockDb.setMockResults([]);
      
      const result = await repository.findById(999);
      
      expect(result).toBeNull();
    });
  });
  
  describe('findAll', () => {
    it('should return all entities', async () => {
      const mockEntities = [
        { id: 1, name: 'Test1', email: 'test1@example.com', createdAt: new Date() },
        { id: 2, name: 'Test2', email: 'test2@example.com', createdAt: new Date() },
      ];
      mockDb.setMockResults(mockEntities);
      
      const results = await repository.findAll();
      
      expect(results).toEqual(mockEntities);
      expect(results).toHaveLength(2);
    });
    
    it('should return empty array if no entities', async () => {
      mockDb.setMockResults([]);
      
      const results = await repository.findAll();
      
      expect(results).toEqual([]);
    });
  });
  
  describe('findOne', () => {
    it('should find one entity with condition', async () => {
      const mockEntity = { id: 1, name: 'Test', email: 'test@example.com', createdAt: new Date() };
      mockDb.setMockResults([mockEntity]);
      
      const result = await repository.findOne(eq(mockTable.email, 'test@example.com'));
      
      expect(result).toEqual(mockEntity);
    });
    
    it('should return null if not found', async () => {
      mockDb.setMockResults([]);
      
      const result = await repository.findOne(eq(mockTable.email, 'notfound@example.com'));
      
      expect(result).toBeNull();
    });
  });
  
  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockEntities = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Test${i + 1}`,
        email: `test${i + 1}@example.com`,
        createdAt: new Date(),
      }));
      
      // Mock count query
      mockDb.select = mock(() => {
        const countChain = {
          from: mock(() => countChain),
          where: mock(() => countChain),
          then: mock((resolve: any) => resolve([{ count: 5 }])),
        };
        return countChain;
      });
      
      // After first call, switch to data query
      let callCount = 0;
      const originalSelect = mockDb.select;
      mockDb.select = mock(() => {
        callCount++;
        if (callCount === 1) {
          // Count query
          return originalSelect();
        } else {
          // Data query - return 2 items for page 1
          mockDb.setMockResults(mockEntities.slice(0, 2));
          const dataChain = {
            from: mock(() => dataChain),
            where: mock(() => dataChain),
            limit: mock(() => dataChain),
            offset: mock(() => dataChain),
            orderBy: mock(() => dataChain),
            then: mock((resolve: any) => resolve(mockEntities.slice(0, 2))),
          };
          return dataChain;
        }
      });
      
      const result = await repository.findPaginated({ page: 1, limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });
  });
  
  describe('create', () => {
    it('should create a new entity', async () => {
      const newEntity = { name: 'New', email: 'new@example.com' };
      const createdEntity = { id: 1, ...newEntity, createdAt: new Date() };
      mockDb.setMockResults([createdEntity]);
      
      const result = await repository.create(newEntity as any);
      
      expect(result).toEqual(createdEntity);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
  
  describe('createMany', () => {
    it('should create multiple entities', async () => {
      const newEntities = [
        { name: 'New1', email: 'new1@example.com' },
        { name: 'New2', email: 'new2@example.com' },
      ];
      const createdEntities = newEntities.map((e, i) => ({
        id: i + 1,
        ...e,
        createdAt: new Date(),
      }));
      mockDb.setMockResults(createdEntities);
      
      const results = await repository.createMany(newEntities as any);
      
      expect(results).toEqual(createdEntities);
      expect(results).toHaveLength(2);
    });
    
    it('should return empty array for empty input', async () => {
      const results = await repository.createMany([]);
      
      expect(results).toEqual([]);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    it('should update entity by id', async () => {
      const updatedEntity = { id: 1, name: 'Updated', email: 'test@example.com', createdAt: new Date() };
      mockDb.setMockResults([updatedEntity]);
      
      const result = await repository.update(1, { name: 'Updated' });
      
      expect(result).toEqual(updatedEntity);
      expect(mockDb.update).toHaveBeenCalled();
    });
    
    it('should return null if entity not found', async () => {
      mockDb.setMockResults([]);
      
      const result = await repository.update(999, { name: 'Updated' });
      
      expect(result).toBeNull();
    });
  });
  
  describe('delete', () => {
    it('should delete entity by id', async () => {
      mockDb.setMockResults([{ id: 1 }]); // Simulate 1 row deleted
      
      const result = await repository.delete(1);
      
      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });
    
    it('should return false if entity not found', async () => {
      mockDb.setMockResults([]); // Simulate 0 rows deleted
      
      const result = await repository.delete(999);
      
      expect(result).toBe(false);
    });
  });
  
  describe('count', () => {
    it('should count all entities', async () => {
      mockDb.select = mock(() => ({
        from: mock(() => ({
          then: mock((resolve: any) => resolve([{ count: 10 }])),
        })),
      }));
      
      const count = await repository.count();
      
      expect(count).toBe(10);
    });
    
    it('should count with condition', async () => {
      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => ({
            then: mock((resolve: any) => resolve([{ count: 3 }])),
          })),
        })),
      }));
      
      const count = await repository.count(eq(mockTable.name, 'Test'));
      
      expect(count).toBe(3);
    });
  });
  
  describe('exists', () => {
    it('should return true if entity exists', async () => {
      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => ({
            then: mock((resolve: any) => resolve([{ count: 1 }])),
          })),
        })),
      }));
      
      const exists = await repository.exists(1);
      
      expect(exists).toBe(true);
    });
    
    it('should return false if entity does not exist', async () => {
      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => ({
            then: mock((resolve: any) => resolve([{ count: 0 }])),
          })),
        })),
      }));
      
      const exists = await repository.exists(999);
      
      expect(exists).toBe(false);
    });
  });
  
  describe('findOrCreate', () => {
    it('should return existing entity if found', async () => {
      const existingEntity = { id: 1, name: 'Existing', email: 'test@example.com', createdAt: new Date() };
      
      // Mock findOne to return existing
      repository.findOne = mock(() => Promise.resolve(existingEntity));
      repository.create = mock(() => Promise.resolve(null as any));
      
      const result = await repository.findOrCreate(
        eq(mockTable.email, 'test@example.com'),
        { name: 'New', email: 'test@example.com' } as any
      );
      
      expect(result.entity).toEqual(existingEntity);
      expect(result.created).toBe(false);
      expect(repository.create).not.toHaveBeenCalled();
    });
    
    it('should create new entity if not found', async () => {
      const newEntity = { id: 1, name: 'New', email: 'new@example.com', createdAt: new Date() };
      
      // Mock findOne to return null
      repository.findOne = mock(() => Promise.resolve(null));
      repository.create = mock(() => Promise.resolve(newEntity));
      
      const result = await repository.findOrCreate(
        eq(mockTable.email, 'new@example.com'),
        { name: 'New', email: 'new@example.com' } as any
      );
      
      expect(result.entity).toEqual(newEntity);
      expect(result.created).toBe(true);
      expect(repository.create).toHaveBeenCalled();
    });
  });
});