import TaskModel from '../models/task.model';
import { TaskStatusEnum } from '../enums/task.enum';

// ── Tool definitions (sent to the LLM) ──────────────────────────────────────

export const toolDefinitions = [
  {
    name: 'get_tasks',
    description:
      'Fetch tasks in a workspace. Optionally filter by projectId, status, or keyword.',
    parameters: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'The workspace ID (required)' },
        projectId: { type: 'string', description: 'Filter by a specific project ID' },
        status: {
          type: 'string',
          enum: Object.values(TaskStatusEnum),
          description: 'Filter by task status',
        },
        keyword: { type: 'string', description: 'Search tasks by title keyword' },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in the given workspace and project.',
    parameters: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        projectId: { type: 'string' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        status: { type: 'string', enum: Object.values(TaskStatusEnum) },
        assignedTo: { type: 'string', description: 'User ID to assign the task to' },
        dueDate: { type: 'string', description: 'ISO date string' },
      },
      required: ['workspaceId', 'projectId', 'title'],
    },
  },
  {
    name: 'update_status',
    description: 'Change the status of an existing task.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The task ID to update' },
        status: {
          type: 'string',
          enum: Object.values(TaskStatusEnum),
          description: 'New status value',
        },
      },
      required: ['taskId', 'status'],
    },
  },
];

// ── Tool executor ────────────────────────────────────────────────────────────

export type ToolName = 'get_tasks' | 'create_task' | 'update_status';

export async function executeTool(
  name: ToolName,
  args: Record<string, any>
): Promise<Record<string, any>> {
  switch (name) {
    case 'get_tasks': {
      const query: Record<string, any> = { workspace: args.workspaceId };
      if (args.projectId) query.project = args.projectId;
      if (args.status) query.status = args.status;
      if (args.keyword) query.title = { $regex: args.keyword, $options: 'i' };

      // TODO: connect to MongoDB
      const tasks = await TaskModel.find(query)
        .limit(20)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name')
        .populate('project', 'name emoji')
        .lean();

      return { tasks };
    }

    case 'create_task': {
      // TODO: connect to MongoDB
      const task = await TaskModel.create({
        title: args.title,
        description: args.description ?? null,
        priority: args.priority ?? 'MEDIUM',
        status: args.status ?? 'TODO',
        assignedTo: args.assignedTo ?? null,
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        workspace: args.workspaceId,
        project: args.projectId,
      });
      return { task };
    }

    case 'update_status': {
      // TODO: connect to MongoDB
      const task = await TaskModel.findByIdAndUpdate(
        args.taskId,
        { status: args.status },
        { new: true }
      ).lean();

      if (!task) return { error: 'Task not found' };
      return { task };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
