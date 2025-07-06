import { Hono, Env as BaseEnv } from 'hono';
import groupRouter from './routes/groups';
import teamRouter from './routes/teams';
import authRouter from './routes/auth';
import { jwtAuthMiddleware } from '../middleware/auth';
import lineWebhookRouter from './routes/line';
import userRouter from './routes/users';
import practiceRouter from './routes/practices';
import placeRouter from './routes/places';

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
// 指定されたエンドポイントがなかった場合
//---------------------------
app.notFound((c) => c.text('お探しのページは見つかりませんでした', 404));

export default app;
