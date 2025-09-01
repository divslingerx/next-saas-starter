/**
 * Counter Management Service
 * Handles safe counter operations using database advisory locks
 */

import { db } from "../../../db";
import { sql } from "drizzle-orm";

export class CounterService {
  /**
   * Safely update list member count
   */
  static async updateListMemberCount(listId: number): Promise<void> {
    try {
      await db.execute(sql`SELECT safe_update_list_member_count(${listId})`);
    } catch (error) {
      console.error(`Failed to update list ${listId} member count:`, error);
      throw error;
    }
  }

  /**
   * Safely update pipeline record count
   */
  static async updatePipelineRecordCount(pipelineId: number): Promise<void> {
    try {
      await db.execute(sql`SELECT safe_update_pipeline_record_count(${pipelineId})`);
    } catch (error) {
      console.error(`Failed to update pipeline ${pipelineId} record count:`, error);
      throw error;
    }
  }

  /**
   * Batch update all counters (run periodically)
   */
  static async batchUpdateAllCounters(): Promise<void> {
    try {
      await db.execute(sql`SELECT batch_update_counters()`);
      console.log('✅ Batch counter update completed');
    } catch (error) {
      console.error('Failed to batch update counters:', error);
      throw error;
    }
  }

  /**
   * Update multiple list counters efficiently
   */
  static async updateMultipleListCounts(listIds: number[]): Promise<void> {
    const promises = listIds.map(listId => this.updateListMemberCount(listId));
    await Promise.all(promises);
  }

  /**
   * Update multiple pipeline counters efficiently
   */
  static async updateMultiplePipelineCounts(pipelineIds: number[]): Promise<void> {
    const promises = pipelineIds.map(pipelineId => this.updatePipelineRecordCount(pipelineId));
    await Promise.all(promises);
  }
}