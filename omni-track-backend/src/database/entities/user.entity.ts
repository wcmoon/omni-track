import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  })
  subscriptionTier!: 'free' | 'basic' | 'premium' | 'enterprise';

  @Column({ nullable: true })
  subscriptionStartDate?: Date;

  @Column({ nullable: true })
  subscriptionEndDate?: Date;

  @Column({ default: 3 })
  maxProjects!: number;

  @Column({ default: 100 })
  maxLogEntries!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}