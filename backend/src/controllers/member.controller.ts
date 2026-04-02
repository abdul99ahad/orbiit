import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { z } from 'zod';
import { HTTPSTATUS } from '../config/http.config';
import { joinWorkspaceByInviteService, removeMemberFromWorkspaceService } from '../services/member.service';
import { getMemberRoleWorkspace } from '../services/member.service';
import { Permissions } from '../enums/role.enum';
import { roleGuard } from '../utils/roleGuard';

export const joinWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;
    const { workspaceId, role } = await joinWorkspaceByInviteService(userId, inviteCode);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Workspace joined successfully',
      workspaceId,
      role,
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
