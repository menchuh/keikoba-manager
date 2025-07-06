import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { groups } from '../schema/groups';
import { logger } from '../utils/logger';
import { BOOL_FLAG_FALSE, BOOL_FLAG_TRUE, LIST_LIMIT } from '../const/commons';

/**
 * groupIdを元にグループを取得する関数
 * @param groupId
 * @param c
 * @returns Group
 */
export const getGroupByGroupId = async (groupId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db
			.select({ groupIdTeamId: groups.groupIdTeamId, groupName: groups.name, groupId: groups.groupId })
			.from(groups)
			.where(eq(groups.groupId, groupId))
			.get();
		return result;
	} catch (err) {
		return null;
	}
};

/**
 * groupIdTeamIdを元にグループを取得する関数
 * @param groupIdTeamId
 * @param c
 * @returns Group
 */
export const getGroupByGroupIdTeamId = async (groupIdTeamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.select().from(groups).where(eq(groups.groupIdTeamId, groupIdTeamId)).get();
		return result;
	} catch (err) {
		return null;
	}
};

export const listGroups = async (teamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db
			.select()
			.from(groups)
			.where(and(eq(groups.teamId, teamId), eq(groups.isDeleted, BOOL_FLAG_FALSE)))
			.limit(LIST_LIMIT);
		return result;
	} catch (err) {
		logger.error('Failed to create a group');
	}
};

/**
 * グループを作成する関数
 * @param teamId
 * @param name
 * @param groupId
 * @param groupIdTeamId
 * @param c
 * @returns Group
 */
export const createGroup = async (teamId: string, name: string, groupId: string, groupIdTeamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.insert(groups).values({ groupIdTeamId, groupId, teamId, name }).returning().get();
		return result;
	} catch (err) {
		logger.error('Failed to create a group');
	}
};

/**
 * グループ情報（name）を更新する関数
 * @param groupIdTeamId
 * @param name
 * @param c
 * @returns
 */
export const updateGroupById = async (groupIdTeamId: string, name: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.update(groups).set({ name }).where(eq(groups.groupIdTeamId, groupIdTeamId)).returning().get();
		return result;
	} catch (err) {
		logger.error('Failed to update a group');
	}
};

/**
 * グループを論理削除する関数
 * @param groupIdTeamId
 * @param c
 */
export const deleteGroupById = async (groupIdTeamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		await db.update(groups).set({ isDeleted: BOOL_FLAG_TRUE }).where(eq(groups.groupIdTeamId, groupIdTeamId));
	} catch (err) {
		logger.error('Failed to delete a group');
		logger.info(groupIdTeamId);
	}
};
