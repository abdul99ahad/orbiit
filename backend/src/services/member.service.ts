import { ErrorCodeEnum } from '../enums/error-code.enum';
import { Roles } from '../enums/role.enum';
import MemberModel from '../models/member.model';
import RoleModel from '../models/roles-permission.model';
import WorkspaceModel from '../models/workspace.model';
import JoinRequestModel from '../models/join-request.model';
import UserModel from '../models/user.model';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../utils/appError';
import { getIO } from '../socket';

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

export const createJoinRequestService = async (
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

  const existingRequest = await JoinRequestModel.findOne({
    userId,
    workspaceId: workspace._id,
    status: 'pending',
  }).exec();
  if (existingRequest) {
    throw new BadRequestException('You already have a pending join request for this workspace');
  }

  const joinRequest = new JoinRequestModel({
    userId,
    workspaceId: workspace._id,
    status: 'pending',
  });
  await joinRequest.save();

  // Notify workspace Owners and Admins via WebSocket
  const adminRoles = await RoleModel.find({ name: { $in: [Roles.OWNER, Roles.ADMIN] } }).lean();
  const adminRoleIds = adminRoles.map((r) => r._id);

  const adminMembers = await MemberModel.find({
    workspaceId: workspace._id,
    role: { $in: adminRoleIds },
  })
    .select('userId')
    .lean();

  const requestingUser = await UserModel.findById(userId)
    .select('name email profilePicture')
    .lean();

  const io = getIO();
  const payload = {
    requestId: joinRequest._id.toString(),
    workspaceId: workspace._id.toString(),
    workspaceName: workspace.name,
    user: {
      _id: userId,
      name: requestingUser?.name ?? '',
      email: requestingUser?.email ?? '',
      profilePicture: requestingUser?.profilePicture ?? '',
    },
  };

  for (const admin of adminMembers) {
    io.to(`user:${admin.userId.toString()}`).emit('join:request', payload);
  }

  return {
    requestId: joinRequest._id.toString(),
    workspaceName: workspace.name,
  };
};

export const respondToJoinRequestService = async (
  requestId: string,
  action: 'approved' | 'denied'
) => {
  const joinRequest = await JoinRequestModel.findById(requestId).exec();
  if (!joinRequest) {
    throw new NotFoundException('Join request not found');
  }

  if (joinRequest.status !== 'pending') {
    throw new BadRequestException('This request has already been resolved');
  }

  joinRequest.status = action;
  await joinRequest.save();

  if (action === 'approved') {
    const role = await RoleModel.findOne({ name: Roles.MEMBER });
    if (!role) throw new NotFoundException('Role not found');

    const newMember = new MemberModel({
      userId: joinRequest.userId,
      workspaceId: joinRequest.workspaceId,
      role: role._id,
      joinedAt: new Date(),
    });
    await newMember.save();
  }

  const io = getIO();
  io.to(`user:${joinRequest.userId.toString()}`).emit('join:response', {
    requestId,
    status: action,
    workspaceId: joinRequest.workspaceId.toString(),
  });

  return { requestId, status: action };
};
