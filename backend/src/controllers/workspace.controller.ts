import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import {
  changeRoleSchema,
  createWorkSpaceSchema,
  updateWorkSpaceSchema,
  workspaceIdSchema,
} from '../validation/workspace.validation';
import { HTTPSTATUS } from '../config/http.config';
import {
  changeMemberRoleService,
  createWorkSpaceService,
  deleteWorkspaceByIdService,
  getAllWorkspacesUserIsMemberService,
  getWorkspaceAnalyticsService,
  getWorkspaceByIdService,
  getWorkspaceMembersService,
  updateWorkspaceByIdService,
} from '../services/workspace.service';
import { getMemberRoleWorkspace } from '../services/member.service';
import { Permissions } from '../enums/role.enum';
import { roleGuard } from '../utils/roleGuard';

export const createWorkSpaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createWorkSpaceSchema.parse(req.body);
    const userId = req.user?._id;
    const { workspace } = await createWorkSpaceService(userId, body);
    return res.status(HTTPSTATUS.CREATED).json({
      message: 'Workspace created successfully',
      workspace,
    });
  }
);

export const getAllWorkspacesUserIsMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaces } = await getAllWorkspacesUserIsMemberService(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'User workspaces fetched successfully',
      workspaces,
    });
  }
);

export const getWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    await getMemberRoleWorkspace(userId, workspaceId);
    const { workspace } = await getWorkspaceByIdService(workspaceId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'User workspace fetched successfully',
      workspace,
    });
  }
);

export const getWorkSpaceMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);
    const { members, roles } = await getWorkspaceMembersService(workspaceId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Workspace members fetched successfully',
      members,
      roles,
    });
  }
);

export const getWorkspaceAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);
    const { analytics } = await getWorkspaceAnalyticsService(workspaceId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Workspace analytics fetched successfully',
      analytics,
    });
  }
);

export const changeWorkspaceMemberRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const { memberId, roleId } = changeRoleSchema.parse(req.body);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CHANGE_MEMBER_ROLE]);
    const { member } = await changeMemberRoleService(workspaceId, memberId, roleId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Member role changed successfully',
      member,
    });
  }
);

export const updateWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { name, description } = updateWorkSpaceSchema.parse(req.body);
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_WORKSPACE]);
    const { workspace } = await updateWorkspaceByIdService(
      workspaceId,
      name,
      description
    );
    return res.status(HTTPSTATUS.OK).json({
      message: 'Workspace updated successfully',
      workspace,
    });
  }
);

export const deleteWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_WORKSPACE]);
    const { currentWorkspace } = await deleteWorkspaceByIdService(workspaceId, userId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Workspace deleted successfully',
      currentWorkspace,
    });
  }
);
