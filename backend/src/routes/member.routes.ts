import { Router } from 'express';
import {
  requestJoinWorkspaceController,
  respondToJoinRequestController,
  removeMemberController,
} from '../controllers/member.controller';

const memberRoutes = Router();

// Join workspace via invite code — creates a pending request (notifies Owner/Admin via WebSocket)
memberRoutes.post('/workspace/:inviteCode/join', requestJoinWorkspaceController);

// Owner/Admin approves or denies a join request
memberRoutes.put(
  '/workspace/:workspaceId/join-request/:requestId/respond',
  respondToJoinRequestController
);

// Owner removes an existing member
memberRoutes.delete('/workspace/:workspaceId/remove/:memberId', removeMemberController);

export default memberRoutes;

