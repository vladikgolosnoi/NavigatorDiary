import { Module } from '@nestjs/common'
import { SpecialtiesService } from './specialties.service'
import { SpecialtiesController } from './specialties.controller'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [ChatModule],
  providers: [SpecialtiesService],
  controllers: [SpecialtiesController]
})
export class SpecialtiesModule {}
