import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { HTTPSTATUS } from '../config/http.config';
import { runChatAgent, ChatMessage } from './chat.service';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty'),
  workspaceId: z.string().min(1, 'workspaceId is required'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'tool']),
        content: z.string(),
        toolName: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const chatController = asyncHandler(async (req: Request, res: Response) => {
  const { message, workspaceId, history } = chatSchema.parse(req.body);

  const { reply, updatedHistory } = await runChatAgent(
    message,
    history as ChatMessage[],
    workspaceId
  );

  return res.status(HTTPSTATUS.OK).json({ reply, history: updatedHistory });
});
