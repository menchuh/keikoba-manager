import { Hono } from 'hono';
import * as placeControlloers from '../controllers/places';

const placeRouter = new Hono();

placeRouter.post(placeControlloers.postPlace);

export default placeRouter;
