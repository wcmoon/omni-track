export class User {
  id!: string;
  name!: string;
  email!: string;
  password!: string;
  subscriptionTier!: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  maxProjects!: number;
  maxLogEntries!: number;
  createdAt!: Date;
  updatedAt!: Date;
}