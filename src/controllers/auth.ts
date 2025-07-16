import { Context } from 'hono';
import { sign } from 'hono/jwt';
import { getUserById } from '../models/users';

/**
 * ログイン処理
 * @param c
 * @returns
 */
export const login = async (c: Context) => {
	//---------------------------
	// 定数
	//---------------------------
	const jwtSecret = c.env.JWT_SECRET as string;

	//---------------------------
	// ユーザーの取得
	//---------------------------
	const { userId } = await c.req.json();
	const user = await getUserById(userId, c);
	if (!user) {
		c.json({ message: "The user doesn't exist." });
	}

	//---------------------------
	// トークン発行
	//---------------------------
	const token = await sign({ exp: Math.round(Date.now() / 1000 + 60 * 60), data: { userId } }, jwtSecret);

	return c.json({ message: 'Login success', token });
};
