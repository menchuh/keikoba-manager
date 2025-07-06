import { sql } from 'drizzle-orm';
import { foreignKey, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { teams } from './teams';

export const users = sqliteTable(
	'users',
	{
		userId: text('user_id').primaryKey().unique(),
		displayName: text('display_name').notNull(),
		teamId: text('team_id').notNull(),
		isAdmin: integer().notNull().default(0),
		isEnabled: integer().notNull().default(1),
		isDeleted: integer().notNull().default(0),
		createdAt: text('created_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: text('updated_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		teamFk: foreignKey({
			name: 'users_teams_id_fk',
			columns: [table.teamId],
			foreignColumns: [teams.teamId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
	})
);
