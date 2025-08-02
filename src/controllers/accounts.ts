import { Context } from 'hono';
import { accounts } from '../../schema/accounts';
import { createAccount, deleteAccountById } from '../models/accounts';

// 登録処理
export const postAccount = async (c: Context) => {
	try {
		const requestBody = await c.req.json<typeof accounts.$inferInsert>();

		if (!requestBody.accountId) {
			return c.json({ success: false, error: 'パラメータ不足' }, 400);
		}

		const { accountId } = requestBody;
		const result = await createAccount(accountId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ登録に失敗しました。ダメですよ' }, 500);
	}
};

// 削除処理
export const deleteAccount = async (c: Context) => {
	try {
		const accountId = c.req.param().id;
		const result = await deleteAccountById(accountId, c);
		return c.json({ success: true, data: result }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ削除に失敗しました。ダメですよ' }, 500);
	}
};
