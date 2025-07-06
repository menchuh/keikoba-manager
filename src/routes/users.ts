import { Hono } from 'hono';
import * as UserControllers from '../controllers/users';

const userRouter = new Hono();

userRouter.post(UserControllers.postUser);

export default userRouter;
