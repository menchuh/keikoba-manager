import { Hono } from 'hono';
import * as accountControllers from '../controllers/accounts';

const accountRouter = new Hono();

accountRouter.post(accountControllers.postAccount);
accountRouter.delete('/:id', accountControllers.deleteAccount);

export default accountRouter;
