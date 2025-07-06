import { Context } from 'hono';
import { logger } from './logger';
import { decode } from 'hono/jwt';

export const getPayload = (c: Context) => {
	const authHeader = c.req.header('Authorization');
	if (!authHeader) {
		logger.error('No token provided');
		return;
	}

	const token = authHeader.replace('Bearer ', '');
	const { payload } = decode(token);

	return payload;
};
