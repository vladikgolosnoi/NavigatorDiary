import { Module } from '@nestjs/common'
import { BeaverHutService } from './beaver-hut.service'
import { BeaverHutController } from './beaver-hut.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [BeaverHutService],
  controllers: [BeaverHutController]
})
export class BeaverHutModule {}
