import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { z } from 'zod';
import { HTTPSTATUS } from '../config/http.config';
import {
  getMemberRoleWorkspace,
  removeMemberFromWorkspaceService,
  createJoinRequestService,
  respondToJoinRequestService,
} from '../services/member.service';
import { Permissions } from '../enums/role.enum';
import { roleGuard } from '../utils/roleGuard';

export const requestJoinWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;

    const { requestId, workspaceName } = await createJoinRequestService(userId, inviteCode);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Join request submitted — waiting for approval',
      requestId,
      workspaceName,
    });
  }
);

export const respondToJoinRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = z.string().parse(req.params.workspaceId);
    const requestId = z.string().parse(req.params.requestId);
    const action = z.enum(['approved', 'denied']).parse(req.body.action);
    const userId = req.user?._id;

    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.ADD_MEMBER]);

    const result = await respondToJoinRequestService(requestId, action);

    return res.status(HTTPSTATUS.OK).json({
      message: `Join request ${action}`,
      ...result,
    });
  }
);

export const removeMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = z.string().parse(req.params.workspaceId);
    const memberId = z.string().parse(req.params.memberId);
    const requestingUserId = req.user?._id;

    const { role } = await getMemberRoleWorkspace(requestingUserId, workspaceId);
    roleGuard(role, [Permissions.REMOVE_MEMBER]);

    const { memberId: removed } = await removeMemberFromWorkspaceService(
      requestingUserId,
      workspaceId,
      memberId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: 'Member removed successfully',
      memberId: removed,
    });
  }
);
