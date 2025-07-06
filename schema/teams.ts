import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const teams = sqliteTable(
	'teams',
	{
		teamId: text('team_id').primaryKey().unique(),
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
	() => []
);
