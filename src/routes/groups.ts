import { Hono } from 'hono';
import * as groupControllers from '../controllers/groups';

const groupRouter = new Hono();

groupRouter.get(groupControllers.getGroup);
groupRouter.post(groupControllers.postGroup);
groupRouter.put(groupControllers.putGroup);

groupRouter.get('/:id', groupControllers.getGroups);
groupRouter.delete('/:id', groupControllers.deleteGroup);

export default groupRouter;
