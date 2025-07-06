import { sql } from 'drizzle-orm';
import { foreignKey, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts';
import { groups } from './groups';

export const accountGroups = sqliteTable(
	'account_groups',
	{
		accountGroupId: integer('account_group_id').primaryKey({ autoIncrement: true }),
		accountId: text('account_id').notNull(),
		groupIdTeamId: text('group_id_team_id').notNull(),
		createdAt: text('created_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: text('updated_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		accountFk: foreignKey({
			name: 'accounts_account_id_fk',
			columns: [table.accountId],
			foreignColumns: [accounts.accountId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
		groupFk: foreignKey({
			name: 'accounts_group_teams_id_fk',
			columns: [table.groupIdTeamId],
			foreignColumns: [groups.groupIdTeamId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
	})
);
