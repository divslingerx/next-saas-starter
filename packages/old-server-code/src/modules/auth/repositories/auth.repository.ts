/**
 * Auth Repository
 * Handles data access for authentication operations
 */

import { db } from "@/db";
import { user, session, account } from "@/db/schema/auth";
import { eq, and, gt } from "drizzle-orm";
import type { SignUpDto, SessionDto } from "../dto/auth.dto";

export class AuthRepository {
  /**
   * Find user by email
   */
  async findUserByEmail(email: string) {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    
    return users[0] || null;
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string) {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    return users[0] || null;
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    name: string;
    emailVerified: boolean;
  }) {
    const [newUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        emailVerified: data.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newUser;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: Partial<{
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
  }>) {
    const [updated] = await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();
    
    return updated;
  }


  /**
   * Find session by token
   */
  async findSessionByToken(token: string) {
    const sessions = await db
      .select()
      .from(session)
      .where(
        and(
          eq(session.token, token),
          gt(session.expiresAt, new Date())
        )
      )
      .limit(1);
    
    return sessions[0] || null;
  }

  /**
   * Delete session by ID
   */
  async deleteSession(sessionId: string) {
    await db
      .delete(session)
      .where(eq(session.id, sessionId));
  }

}