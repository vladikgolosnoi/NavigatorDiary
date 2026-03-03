import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationDto } from './dto/notification.dto'
import { NotificationScope, RoleName } from '@prisma/client'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listMyNotifications(userId: string, teamId?: string | null, role?: RoleName) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [
          { scope: NotificationScope.ALL },
          teamId ? { scope: NotificationScope.TEAM, teamId } : { scope: NotificationScope.TEAM, teamId: 'none' },
          role === RoleName.ORGANIZER ? { scope: NotificationScope.ORGANIZERS } : { scope: NotificationScope.TEAM, teamId: 'none' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    const receipts = await this.prisma.notificationReceipt.findMany({
      where: {
        userId,
        notificationId: { in: notifications.map((n) => n.id) }
      }
    })

    const receiptMap = new Map(receipts.map((r) => [r.notificationId, r.readAt]))

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      scope: notification.scope,
      teamId: notification.teamId,
      createdAt: notification.createdAt,
      expiresAt: notification.expiresAt,
      readAt: receiptMap.get(notification.id) ?? null
    }))
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      throw new BadRequestException('Уведомление не найдено')
    }

    await this.prisma.notificationReceipt.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: { readAt: new Date() },
      create: { notificationId, userId, readAt: new Date() }
    })

    return { success: true }
  }

  async createNotification(userId: string, dto: NotificationDto) {
    if (dto.scope === NotificationScope.TEAM && !dto.teamId) {
      throw new BadRequestException('Для уведомления по команде нужен teamId')
    }

    const created = await this.prisma.notification.create({
      data: {
        title: dto.title,
        body: dto.body,
        scope: dto.scope,
        teamId: dto.scope === NotificationScope.TEAM ? dto.teamId : null,
        createdById: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null
      }
    })
    await this.auditService.log('NOTIFICATION_CREATED', userId, 'Notification', created.id)
    return created
  }

  // RBAC ограничение выполняется на уровне гардов.
}
