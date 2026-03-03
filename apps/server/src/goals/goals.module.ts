import { Module } from '@nestjs/common'
import { GoalsService } from './goals.service'
import { GoalsController } from './goals.controller'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [ChatModule],
  providers: [GoalsService],
  controllers: [GoalsController]
})
export class GoalsModule {}
