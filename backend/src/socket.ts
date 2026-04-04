import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config/app.config';

interface JwtPayload {
  userId: string;
}

let io: Server;

export const initializeSocket = (server: http.Server): Server => {
  const origins = config.FRONTEND_ORIGIN
    .split(',')
    .map((o: string) => o.trim().replace(/\/$/, ''));

  io = new Server(server, {
    cors: {
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, config.JWT_SECRET, {
        audience: ['user'],
      }) as JwtPayload;

      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    // Each user has their own private room for direct notifications
    socket.join(`user:${userId}`);
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
