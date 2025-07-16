import { Context } from 'hono';
import { createUser } from '../models/users';
import { users } from '../../schema/users';

export const postUser = async (c: Context) => {
	try {
		const requestBody = await c.req.json<typeof users.$inferInsert>();

		if (!requestBody.displayName || !requestBody.userId || !requestBody.teamId) {
			return c.json({ success: false, error: 'パラメータ不足' }, 400);
		}

		const { displayName, teamId, userId } = requestBody;
		const result = await createUser(displayName, teamId, userId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ取得に失敗しました。ダメですよ' }, 500);
	}
};
