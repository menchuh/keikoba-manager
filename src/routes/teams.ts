import { Hono } from 'hono';
import * as teamControllers from '../controllers/teams';

const teamRouter = new Hono();

teamRouter.get(teamControllers.getTeam);
teamRouter.post(teamControllers.postTeam);

export default teamRouter;
