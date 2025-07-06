import { Hono } from 'hono';
import * as lineControllers from '../controllers/line';

const lineWebhookRouter = new Hono();

lineWebhookRouter.post(lineControllers.processMessage);

export default lineWebhookRouter;
