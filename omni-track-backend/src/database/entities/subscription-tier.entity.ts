export class SubscriptionTier {
  id!: string;
  name!: string;
  level!: 'free' | 'basic' | 'premium' | 'enterprise';
  price!: number;
  currency!: string;
  billingPeriod!: 'monthly' | 'yearly';
  maxProjects!: number;
  maxLogEntries!: number;
  maxAiQueries!: number;
  features!: string[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}