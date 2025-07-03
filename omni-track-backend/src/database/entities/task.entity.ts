export class Task {
  id!: string;
  title!: string;
  description?: string;
  priority!: 'low' | 'medium' | 'high';
  status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  projectId?: string;
  userId!: string;
  parentTaskId?: string;
  tags?: string[];
  aiGenerated!: boolean;
  aiContext?: string;
  createdAt!: Date;
  updatedAt!: Date;
  completedAt?: Date;
}