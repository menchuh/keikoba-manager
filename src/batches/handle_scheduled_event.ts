import { Env } from 'hono';
import { Env as EnvType } from '../type/env';
import * as scheduledControllers from '../controllers/scheduled';

export const handleScheduledEvent = async (event: ScheduledController, env: Env) => {
	try {
		await scheduledControllers.notifyDailyPractice(env as EnvType);
		return null;
	} catch (err) {
		console.error('TOP LEVEL CATCH:', err);
	}
};
