import { Context } from 'hono';
import { groups } from '../../schema/groups';
import { ulid } from 'ulid';
import { createGroup, deleteGroupById, getGroupByGroupIdTeamId, listGroups, updateGroupById } from '../../models/groups';
import { getTeamIdByUserId } from '../../models/users';
import { generateGroupId } from '../../utils/stringUtils';
import { getPayload } from '../../utils/userUtils';
import { Token } from '../type/token';

// 一件の取得処理
export const getGroup = async (c: Context) => {
	try {
		const groupIdTeamId = c.req.param().id;
		const result = await getGroupByGroupIdTeamId(groupIdTeamId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ取得に失敗しました。ダメですよ' }, 500);
	}
};

//一覧の取得処理
export const getGroups = async (c: Context) => {
	try {
		const payload = getPayload(c);
		const data = payload!.data as Token;
		const { userId } = data;
		const teamId = await getTeamIdByUserId(userId, c);
		const result = await listGroups(teamId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ取得に失敗しました。ダメですよ' }, 500);
	}
};

// 登録処理
export const postGroup = async (c: Context) => {
	try {
		const requestBody = await c.req.json<typeof groups.$inferInsert>();

		if (!requestBody.teamId || !requestBody.name) {
			return c.json({ success: false, error: 'パラメータ不足' }, 400);
		}

		const { teamId, name } = requestBody;
		const groupIdTeamId = ulid();
		const groupId = generateGroupId(8);
		const result = await createGroup(teamId, name, groupId, groupIdTeamId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ登録に失敗しました。ダメですよ' }, 500);
	}
};

export const putGroup = async (c: Context) => {
	try {
		const requestBody = await c.req.json<typeof groups.$inferInsert>();

		if (!requestBody.groupIdTeamId || !requestBody.name) {
			return c.json({ success: false, error: 'パラメータ不足' }, 400);
		}

		const { groupIdTeamId, name } = requestBody;
		const result = await updateGroupById(groupIdTeamId, name, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ更新に失敗しました。ダメですよ' }, 500);
	}
};

// 削除処理
export const deleteGroup = async (c: Context) => {
	try {
		const groupIdTeamId = c.req.param().id;
		const result = await deleteGroupById(groupIdTeamId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ削除に失敗しました。ダメですよ' }, 500);
	}
};
