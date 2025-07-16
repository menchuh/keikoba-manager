import { Hono } from 'hono';
import * as scheduledControllers from '../controllers/scheduled';

const scheduledRouter = new Hono();

scheduledRouter.post('/daily_notification', scheduledControllers.notifyDailyPractice);

export default scheduledRouter;
