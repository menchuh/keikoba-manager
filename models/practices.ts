import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { practices } from '../schema/practices';
import { logger } from '../utils/logger';
import { groups } from '../schema/groups';
import { places } from '../schema/places';
import { BOOL_FLAG_FALSE } from '../const/commons';

/**
 * グループの練習予定を取得する関数
 * @param groupIdTeamId
 * @param c
 * @returns
 */
export const getPracticesByGroup = async (groupIdTeamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const results = await db
			.select({
				date: practices.date,
				startTime: practices.startTime,
				endTime: practices.endTime,
				groupName: groups.name,
				placeName: places.name,
			})
			.from(practices)
			.rightJoin(groups, eq(practices.groupIdTeamId, groups.groupIdTeamId))
			.rightJoin(places, eq(practices.placeId, places.placeId))
			.where(and(eq(practices.groupIdTeamId, groupIdTeamId), eq(practices.isDeleted, BOOL_FLAG_FALSE)));
		return results;
	} catch (err) {
		logger.error('Failed to get practices');
		throw new Error('aaa');
	}
};

/**
 * 練習予定を作成する関数
 * @param practiceId
 * @param groupIdTeamId
 * @param placeId
 * @param date
 * @param startTime
 * @param endTime
 * @param c
 * @returns
 */
export const createPractice = async (
	practiceId: string,
	groupIdTeamId: string,
	placeId: string,
	date: string,
	startTime: string,
	endTime: string,
	c: Context
) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.insert(practices).values({ practiceId, groupIdTeamId, placeId, date, startTime, endTime }).returning().get();
		return result;
	} catch (err) {
		logger.error('Failed to create practices');
		logger.error(err);
		throw new Error('aaa');
	}
};

/**
 * 同じ日時、時刻の稽古が存在するかチェックする関数
 * @param groupIdTeamId
 * @param placeId
 * @param date
 * @param startTime
 * @param c
 * @returns
 */
export const isSamePracticeItemExists = async (groupIdTeamId: string, placeId: string, date: string, startTime: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db
			.select()
			.from(practices)
			.where(
				and(
					eq(practices.groupIdTeamId, groupIdTeamId),
					eq(practices.placeId, placeId),
					eq(practices.date, date),
					eq(practices.startTime, startTime),
					eq(practices.isDeleted, BOOL_FLAG_FALSE)
				)
			);
		if (result.length !== 0) return true;
		return false;
	} catch (err) {
		logger.error('Failed to get practices');
		throw new Error('aaa');
	}
};
