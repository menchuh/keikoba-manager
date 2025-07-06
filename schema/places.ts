import { sql } from 'drizzle-orm';
import { foreignKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { teams } from './teams';

export const places = sqliteTable(
	'places',
	{
		placeId: text('place_id').primaryKey().unique(),
		teamId: text('team_id').notNull(),
		name: text('name').notNull(),
		address: text('address').notNull(),
		imageUrl: text('image_url'),
		createdAt: text('created_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: text('updated_at')
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		teamFk: foreignKey({
			name: 'places_teams_id_fk',
			columns: [table.teamId],
			foreignColumns: [teams.teamId],
		})
			.onDelete('cascade')
			.onUpdate('restrict'),
	})
);
