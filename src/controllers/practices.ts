import { Context } from 'hono';
import { practices } from '../../schema/practices';
import { ulid } from 'ulid';
import { createPractice, getPracticesByGroup, isSamePracticeItemExists } from '../../models/practices';

export const getPractices = async (c: Context) => {
	const groupIdTeamId = c.req.param().id;

	const result = await getPracticesByGroup(groupIdTeamId, c);
	return c.json({ success: true, data: result }, 200);
};

export const postPractices = async (c: Context) => {
	const requestBody = await c.req.json<typeof practices.$inferInsert>();

	if (!requestBody.groupIdTeamId || !requestBody.placeId || !requestBody.date || !requestBody.startTime) {
		return c.json({ success: false, error: 'パラメータ不足' }, 400);
	}

	const practiceId = ulid();
	const { groupIdTeamId, placeId, date, startTime } = requestBody;
	let { endTime } = requestBody;
	if (!endTime) endTime = '';

	if (await isSamePracticeItemExists(groupIdTeamId, placeId, date, startTime, c)) {
		return c.json({ success: false, data: 'すでに同じアイテムがあります' }, 400);
	}

	const result = await createPractice(practiceId, groupIdTeamId, placeId, date, startTime, endTime, c);
	return c.json({ success: true, data: result }, 200);
};
