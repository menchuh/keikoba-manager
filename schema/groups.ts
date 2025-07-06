import { sql } from 'drizzle-orm';
import { foreignKey, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { teams } from './teams';

export const groups = sqliteTable(
	'groups',
	{
		groupIdTeamId: text('group_id_team_id').primaryKey().unique(),
		groupId: text('group_id').notNull(),
		name: text('name').notNull(),
		teamId: text('team_id').notNull(),
		isDeleted: integer('is_deleted').notNull().default(0),
		createdAt: text('created_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: text('updated_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		teamFk: foreignKey({
			name: 'groups_teams_id_fk',
			columns: [table.teamId],
			foreignColumns: [teams.teamId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
	})
);
