import { Module } from '@nestjs/common'
import { TeamsController } from './teams.controller'
import { TeamsService } from './teams.service'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [AuditModule],
  controllers: [TeamsController],
  providers: [TeamsService]
})
export class TeamsModule {}
