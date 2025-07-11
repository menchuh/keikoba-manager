import { Hono } from 'hono';
import * as practiceControllers from '../controllers/practices';

const practiceRouter = new Hono();

practiceRouter.post(practiceControllers.postPractices);

practiceRouter.get('/:id', practiceControllers.postPractices);

export default practiceRouter;
