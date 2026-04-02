import { Router } from 'express';
import { chatController } from './chat.controller';

const chatRoutes = Router();

chatRoutes.post('/', chatController);

export default chatRoutes;
