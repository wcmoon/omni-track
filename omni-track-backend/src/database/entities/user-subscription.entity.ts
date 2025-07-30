import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum SubscriptionTier {
  FREE = 'free',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE
  })
  tier!: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status!: SubscriptionStatus;

  @Column({ type: 'int', default: 0 })
  v3TokensUsed!: number; // V3模型已使用的Token数

  @Column({ type: 'int', default: 0 })
  r1TokensUsed!: number; // R1模型已使用的Token数

  @Column({ type: 'int', default: 50000 }) // 免费用户V3每月5万Token
  v3TokensLimit!: number;

  @Column({ type: 'int', default: 10000 }) // 免费用户R1每月1万Token  
  r1TokensLimit!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost!: number; // 本月总成本（元）

  @Column({ type: 'timestamp', nullable: true })
  validUntil?: Date; // 订阅有效期

  @Column({ type: 'timestamp', nullable: true })
  lastResetAt?: Date; // 上次重置时间

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}