import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { accountGroups } from '../../schema/account_groups';
import { groups } from '../../schema/groups';
import { teams } from '../../schema/teams';
import { logger } from '../../utils/logger';

export const getBelongingGroups = async (accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const results = await db
			.select({ groupId: groups.groupId, groupIdTeamId: groups.groupIdTeamId, groupName: groups.name, teamId: teams.teamId })
			.from(accountGroups)
			.rightJoin(groups, eq(groups.groupIdTeamId, accountGroups.groupIdTeamId))
			.rightJoin(teams, eq(groups.teamId, teams.teamId))
			.where(eq(accountGroups.accountId, accountId));
		return results;
	} catch (err) {
		logger.info('Failed to get account group records.');
	}
};

export const joinGroups = async (groupIdTeamId: string, accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		await db.insert(accountGroups).values({ groupIdTeamId, accountId });
	} catch (err) {
		logger.error('Failed to let an account join to group.');
	}
};

export const withdrawGroup = async (groupIdTeamId: string, accountId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		await db.delete(accountGroups).where(and(eq(accountGroups.groupIdTeamId, groupIdTeamId), eq(accountGroups.accountId, accountId)));
	} catch (err) {
		logger.error('Failed to let an account withdraw to group.');
	}
};

export const listBelongingAccounts = async (groupIdTeamId: string, c: Context) => {
	try {
		const db = drizzle(c.env.DB);
		const results = await db.select().from(accountGroups).where(eq(accountGroups.groupIdTeamId, groupIdTeamId));
		return results;
	} catch (err) {
		logger.error('Failed to list accounts withdraw to group.');
	}
};
