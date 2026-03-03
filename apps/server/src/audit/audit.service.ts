import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export type AuditAction =
  | 'TEAM_APPROVED'
  | 'TEAM_REJECTED'
  | 'USER_APPROVED'
  | 'USER_REJECTED'
  | 'GOAL_PROGRESS'
  | 'GOAL_REACTED'
  | 'GOAL_CONFIRMED'
  | 'SPECIALTY_CHECKED'
  | 'SPECIALTY_CONFIRMED'
  | 'SPECIALTY_NOTIFY_ORGANIZER'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'APPEAL_CREATED'
  | 'APPEAL_REPLIED'
  | 'APPEAL_CLOSED'
  | 'ANNOUNCEMENT_CREATED'
  | 'ANNOUNCEMENT_UPDATED'
  | 'ANNOUNCEMENT_DELETED'
  | 'NOTIFICATION_CREATED'
  | 'BRANCH_AWARD'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: AuditAction, actorId: string | null, entity: string, entityId?: string, data?: object) {
    await this.prisma.auditLog.create({
      data: {
        action,
        actorId,
        entity,
        entityId,
        data: data ?? Prisma.JsonNull
      }
    })
  }
}
