import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { places } from '../schema/places';

export const getPlacesByTeamId = async (teamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const results = await db.select().from(places).where(eq(places.teamId, teamId));
		return results;
	} catch (err) {
		logger.error('Failed to get places');
	}
};

export const getPlaceById = async (placeId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const results = await db.select().from(places).where(eq(places.placeId, placeId)).get();
		return results;
	} catch (err) {
		logger.error('Failed to get place');
	}
};

export const createPlace = async (placeId: string, teamId: string, name: string, address: string, imageUrl: string | null, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const results = await db.insert(places).values({ placeId, teamId, name, address, imageUrl }).returning().get();
		return results;
	} catch (err) {
		logger.error('Failed to create places');
	}
};
