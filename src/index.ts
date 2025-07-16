import { Hono, Env } from 'hono';
import { handleScheduledEvent } from './batches/handle_scheduled_event';
import authRouter from './routes/auth';
import groupRouter from './routes/groups';
import lineWebhookRouter from './routes/line';
import placeRouter from './routes/places';
import practiceRouter from './routes/practices';
import scheduledRouter from './routes/scheduled';
import teamRouter from './routes/teams';
import userRouter from './routes/users';
import { jwtAuthMiddleware } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

//---------------------------
// ヘルスチェック
//---------------------------
app.get('/', (c) => c.text('Hello, Hono with TypeScript!'));

//---------------------------
// ログイン
//---------------------------
app.route('/login', authRouter);
app.route('/users', userRouter);

//---------------------------
// API
//---------------------------
// middleware
app.use('/api/*', jwtAuthMiddleware);
// routes
app.route('/api/groups', groupRouter);
app.route('/api/places', placeRouter);
app.route('/api/practices', practiceRouter);
app.route('/api/teams', teamRouter);

//---------------------------
// Webhook
//---------------------------
app.route('/webhook/line', lineWebhookRouter);

//---------------------------
// Batch
//---------------------------
app.route('/scheduled/*', scheduledRouter);

//---------------------------
// 指定されたエンドポイントがなかった場合
//---------------------------
app.notFound((c) => c.text('お探しのページは見つかりませんでした', 404));

//---------------------------
// バッチ処理
//---------------------------
const scheduled: ExportedHandlerScheduledHandler<Env> = async (event, env, c) => {
	c.waitUntil(handleScheduledEvent(event));
};

export default {
	fetch: app.fetch,
	scheduled,
};
