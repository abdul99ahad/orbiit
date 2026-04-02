import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { config } from './config/app.config';
import connectDatabase from './config/database.config';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { HTTPSTATUS } from './config/http.config';
import './config/passport.config';
import { passportAuthenticationJWT } from './config/passport.config';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.routes';
import workspaceRoutes from './routes/workspace.route';
import memberRoutes from './routes/member.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.route';
import chatRoutes from './chat/chat.route';

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.get('/', (_req: any, res: any) => {
  return res.status(HTTPSTATUS.OK).json({ message: 'Orbiit API is running' });
});

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, passportAuthenticationJWT, userRoutes);
app.use(`${BASE_PATH}/workspace`, passportAuthenticationJWT, workspaceRoutes);
app.use(`${BASE_PATH}/member`, passportAuthenticationJWT, memberRoutes);
app.use(`${BASE_PATH}/project`, passportAuthenticationJWT, projectRoutes);
app.use(`${BASE_PATH}/task`, passportAuthenticationJWT, taskRoutes);
app.use(`${BASE_PATH}/chat`, passportAuthenticationJWT, chatRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV} mode`);
  await connectDatabase();
});

