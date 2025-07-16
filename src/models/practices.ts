import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { BOOL_FLAG_FALSE } from '../../const/commons';
import { practices } from '../../schema/practices';
import { groups } from '../../schema/groups';
import { places } from '../../schema/places';
import { logger } from '../../utils/logger';
import { isBeforeToday } from '../../utils/stringUtils';

/**
 * グループの練習予定を取得する関数
 * @param groupIdTeamId
 * @param c
 * @returns
 */
export const getPracticesByGroup = async (groupIdTeamId: string, isFutureOnly: boolean, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		let results = await db
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
		if (isFutureOnly) {
			results = results.filter((r) => {
				return !isBeforeToday(r.date!);
			});
		}
		return results;
	} catch (err) {
		logger.error('Failed to get practices');
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
	}
};

/**
 * 指定した日付の練習を持つグループIDを重複なく取得する関数
 * @param date
 * @param c
 * @returns
 */
export const getGroupIdHasDeinedDatePractice = async (date: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.selectDistinct({ groupTeamId: practices.groupIdTeamId }).from(practices).where(eq(practices.date, date));
		return result;
	} catch (err) {
		logger.error('Failed to get practices');
	}
};

/**
 * グループIDと日付で指定し練習を取得する関数
 * @param groupIdTeamId
 * @param date
 * @param c
 * @returns
 */
export const getPracticeByGroupIdAndDate = async (groupIdTeamId: string, date: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db
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
			.where(and(eq(practices.date, date), eq(practices.groupIdTeamId, groupIdTeamId), eq(practices.isDeleted, BOOL_FLAG_FALSE)));
		return result;
	} catch (err) {
		logger.error('Failed to get practices');
	}
};
