import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { UserSubscription } from '../../database/entities/user-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSubscription])],
  providers: [AIService],
  controllers: [AIController],
  exports: [AIService],
})
export class AIModule {}
