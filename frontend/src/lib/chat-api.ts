import API from './axios-client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
}

export interface ChatResponse {
  reply: string;
  history: ChatMessage[];
}

export const sendChatMessage = async (
  message: string,
  workspaceId: string,
  history: ChatMessage[]
): Promise<ChatResponse> => {
  const response = await API.post('/chat', { message, workspaceId, history });
  return response.data;
};
