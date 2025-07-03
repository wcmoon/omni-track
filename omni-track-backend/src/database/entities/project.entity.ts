export class Project {
  id!: string;
  name!: string;
  description?: string;
  color?: string;
  icon?: string;
  userId!: string;
  isArchived!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}