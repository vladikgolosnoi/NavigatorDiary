import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/guards/roles.guard'
import { UsersModule } from './users/users.module'
import { CatalogsModule } from './catalogs/catalogs.module'
import { GoalsModule } from './goals/goals.module'
import { SpecialtiesModule } from './specialties/specialties.module'
import { AchievementsModule } from './achievements/achievements.module'
import { ChatModule } from './chat/chat.module'
import { AnnouncementsModule } from './announcements/announcements.module'
import { NotificationsModule } from './notifications/notifications.module'
import { NotesModule } from './notes/notes.module'
import { AppealsModule } from './appeals/appeals.module'
import { AuditModule } from './audit/audit.module'
import { TeamsModule } from './teams/teams.module'
import { BeaverHutModule } from './beaver-hut/beaver-hut.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogsModule,
    GoalsModule,
    SpecialtiesModule,
    AchievementsModule,
    ChatModule,
    AnnouncementsModule,
    NotificationsModule,
    NotesModule,
    AppealsModule,
    AuditModule,
    TeamsModule,
    BeaverHutModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule {}
