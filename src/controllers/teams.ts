import { Context } from 'hono';
import { ulid } from 'ulid';
import { createTeam, getTeamById } from '../models/teams';
import { teams } from '../../schema/teams';

//---------------------------
// 取得処理
//---------------------------
export const getTeam = async (c: Context) => {
	try {
		const queryParams = c.req.queries();
		if (!queryParams.teamId) {
			return c.json({ success: false, error: "Bad Request: Parameters aren't set." }, 400);
		}

		const teamId = queryParams.teamId[0];
		const result = await getTeamById(teamId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ取得に失敗しました。ダメですよ' }, 500);
	}
};

//---------------------------
// 登録処理
//---------------------------
export const postTeam = async (c: Context) => {
	try {
		const requestBody = await c.req.json<typeof teams.$inferInsert>();
		if (!requestBody.name || !requestBody.address) {
			return c.json({ success: false, error: 'パラメータ不足' }, 400);
		}
		const teamId = ulid();
		const { name, address } = requestBody;
		const result = await createTeam(teamId, name, address, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ登録に失敗しました。ダメですよ' }, 500);
	}
};
