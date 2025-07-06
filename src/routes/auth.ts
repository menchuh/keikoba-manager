import { Hono } from 'hono';
import * as authControllers from '../controllers/auth';

const authRouter = new Hono();

authRouter.post(authControllers.login);

export default authRouter;
