import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { accounts } from '../schema/accounts';
import { logger } from '../utils/logger';
import { Session } from '../src/type/session';

export const getAccount = async (accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const result = await db.select().from(accounts).where(eq(accounts.accountId, accountId)).get();
		return result;
	} catch (err) {
		logger.info('Failed to get an account.');
		return null;
	}
};

export const createAccount = async (accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		await db.insert(accounts).values({ accountId, session: JSON.stringify({}) });
	} catch (err) {
		logger.error('Failed to create an account.');
	}
};

export const updateSession = async (session: Session, accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const sessionString = JSON.stringify(session);
		await db.update(accounts).set({ session: sessionString }).where(eq(accounts.accountId, accountId));
	} catch (err) {
		logger.error('Failed to update session.');
	}
};

export const deleteAccountById = async (accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		await db.delete(accounts).where(eq(accounts.accountId, accountId));
	} catch (err) {
		logger.error('Failed to delete an account.');
	}
};
