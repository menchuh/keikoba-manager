import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { logger } from '../utils/logger';

const JWT_SECRET = 'default-secret';

/**
 * JWT検証をするミドルウェア
 * @param c
 * @param next
 * @returns
 */
export const jwtAuthMiddleware = async (c: Context, next: Next) => {
	//---------------------------
	// 定数
	//---------------------------
	const jwtSecret = c.env.JWT_SECRET as string;

	//---------------------------
	// トークン取得
	//---------------------------
	const authHeader = c.req.header('Authorization');
	if (!authHeader) {
		return c.json({ error: 'No token provided' }, 401);
	}
	const token = authHeader.replace('Bearer ', '');

	//---------------------------
	// 検証
	//---------------------------
	try {
		await verify(token, jwtSecret);
		await next();
	} catch (err) {
		logger.info(err);
		return c.json({ error: 'Invalid token' }, 403);
	}
};
