import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { teams } from '../schema/teams';
import { logger } from '../utils/logger';

/**
 * チームを取得する関数
 * @param teamId
 * @param c
 * @returns
 */
export const getTeamById = async (teamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.select().from(teams).where(eq(teams.teamId, teamId)).get();
		return result;
	} catch (err) {
		return null;
	}
};

/**
 * チームを作成する関数
 * @param teamId
 * @param name
 * @param address
 * @param c
 * @returns
 */
export const createTeam = async (teamId: string, name: string, address: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.insert(teams).values({ teamId, name, address }).returning().get();
		return result;
	} catch (err) {
		logger.error('Failed to create a team.');
	}
};
