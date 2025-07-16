import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../schema/users';
import { logger } from '../../utils/logger';

export const getUserById = async (userId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.select().from(users).where(eq(users.userId, userId)).get();
		return result;
	} catch (err) {
		logger.error('Failed to get a user.');
		return '';
	}
};

export const getTeamIdByUserId = async (userId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const user = await db.select().from(users).where(eq(users.userId, userId)).get();
		if (!user) return '';
		const { teamId } = user;
		return teamId;
	} catch (err) {
		logger.error('Failed to get belonging team.');
		return '';
	}
};

export const createUser = async (displayName: string, teamId: string, userId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.insert(users).values({ displayName, teamId, userId }).returning().get();
		return result;
	} catch (err) {
		logger.error('Failed to create a user.');
	}
};
