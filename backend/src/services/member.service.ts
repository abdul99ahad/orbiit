import { ErrorCodeEnum } from '../enums/error-code.enum';
import { Roles } from '../enums/role.enum';
import MemberModel from '../models/member.model';
import RoleModel from '../models/roles-permission.model';
import WorkspaceModel from '../models/workspace.model';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../utils/appError';

export const getMemberRoleWorkspace = async (userId: string, workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }

  const member = await MemberModel.findOne({ userId, workspaceId }).populate('role');
  if (!member) {
    throw new UnauthorizedException(
      'You are not a member of this workspace',
      ErrorCodeEnum.AUTH_UNAUTHORIZED_ACCESS
    );
  }

  return { role: member.role?.name };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
  if (!workspace) {
    throw new NotFoundException('Invalid invite code or workspace not found');
  }

  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();
  if (existingMember) {
    throw new BadRequestException('You are already a member of this workspace');
  }

  const role = await RoleModel.findOne({ name: Roles.MEMBER });
  if (!role) {
    throw new NotFoundException('Role not found');
  }

  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
    joinedAt: new Date(),
  });
  await newMember.save();

  return { workspaceId: workspace._id, role: role.name };
};

export const removeMemberFromWorkspaceService = async (
  requestingUserId: string,
  workspaceId: string,
  memberId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }

  // Prevent removing the workspace owner
  if (workspace.owner.toString() === memberId) {
    throw new BadRequestException('The workspace owner cannot be removed');
  }

  const memberToRemove = await MemberModel.findOne({
    userId: memberId,
    workspaceId,
  });
  if (!memberToRemove) {
    throw new NotFoundException('Member not found in this workspace');
  }

  await MemberModel.deleteOne({ userId: memberId, workspaceId });

  return { memberId };
};
