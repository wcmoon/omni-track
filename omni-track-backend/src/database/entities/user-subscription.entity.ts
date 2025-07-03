export class UserSubscription {
  id!: string;
  userId!: string;
  subscriptionTierId!: string;
  status!: 'active' | 'cancelled' | 'expired' | 'paused';
  startDate!: Date;
  endDate!: Date;
  renewalDate?: Date;
  paymentMethod?: string;
  paymentId?: string;
  amount!: number;
  currency!: string;
  billingPeriod!: 'monthly' | 'yearly';
  autoRenew!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}