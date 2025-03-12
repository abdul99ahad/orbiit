import { z } from 'zod';

export const nameSchmea = z
  .string()
  .trim()
  .min(1, { message: 'Name is required' })
  .max(255);

export const descriptionSchema = z.string().trim().optional();

export const workspaceIdSchema = z.string().trim().min(1, {
  message: 'Workspace ID is required',
});

export const changeRoleSchema = z.object({
  roleId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});

export const createWorkSpaceSchema = z.object({
  name: nameSchmea,
  description: descriptionSchema,
});

export const updateWorkSpaceSchema = z.object({
  name: nameSchmea,
  description: descriptionSchema,
});
