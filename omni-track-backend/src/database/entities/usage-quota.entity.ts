export class UsageQuota {
  id!: string;
  userId!: string;
  period!: 'daily' | 'weekly' | 'monthly';
  periodStartDate!: Date;
  periodEndDate!: Date;
  projectsCreated!: number;
  logEntriesCreated!: number;
  aiQueriesUsed!: number;
  maxProjects!: number;
  maxLogEntries!: number;
  maxAiQueries!: number;
  createdAt!: Date;
  updatedAt!: Date;
}