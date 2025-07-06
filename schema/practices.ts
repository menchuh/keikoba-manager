import { sql } from 'drizzle-orm';
import { foreignKey, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { groups } from './groups';
import { tinyint } from 'drizzle-orm/mysql-core';
import { places } from './places';

export const practices = sqliteTable(
	'practices',
	{
		practiceId: text('practice_id').primaryKey().unique(),
		groupIdTeamId: text('group_id_team_id').notNull(),
		placeId: text('place_id').notNull(),
		date: text('date').notNull(),
		startTime: text('start_time').notNull(),
		endTime: text('end_time'),
		isDeleted: integer().notNull().default(0),
		isNotified: integer().notNull().default(0),
		createdAt: text('created_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: text('updated_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		accountFk: foreignKey({
			name: 'practices_place_id_fk',
			columns: [table.placeId],
			foreignColumns: [places.placeId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
		groupTeamsFk: foreignKey({
			name: 'practices_group_teams_id_fk',
			columns: [table.groupIdTeamId],
			foreignColumns: [groups.groupIdTeamId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
	})
);
