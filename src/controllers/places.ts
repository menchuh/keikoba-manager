import { Context } from 'hono';
import { places } from '../../schema/places';
import { ulid } from 'ulid';
import { createPlace } from '../../models/places';

// 登録処理
export const postPlace = async (c: Context) => {
	try {
		const requestBody = await c.req.json<typeof places.$inferInsert>();

		if (!requestBody.teamId || !requestBody.name || !requestBody.address) {
			return c.json({ success: false, error: 'パラメータ不足' }, 400);
		}

		const { teamId, name, address } = requestBody;
		const imageUrl = requestBody.imageUrl || null;
		const placeId = ulid();
		const result = await createPlace(placeId, teamId, name, address, imageUrl, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ登録に失敗しました。ダメですよ' }, 500);
	}
};
