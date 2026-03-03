import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAppealDto } from './dto/create-appeal.dto'
import { ReplyAppealDto } from './dto/reply-appeal.dto'
import { AppealStatus, RoleName } from '@prisma/client'
import { AuthUser } from '../goals/goals.types'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class AppealsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listMyAppeals(userId: string) {
    return this.prisma.appeal.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async listAllAppeals() {
    return this.prisma.appeal.findMany({
      include: { messages: { orderBy: { createdAt: 'asc' } }, user: true, team: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async createAppeal(user: AuthUser, dto: CreateAppealDto) {
    const appeal = await this.prisma.appeal.create({
      data: {
        userId: user.userId,
        teamId: user.teamId ?? null,
        subject: dto.subject,
        status: AppealStatus.OPEN,
        messages: {
          create: {
            userId: user.userId,
            content: dto.message
          }
        }
      },
      include: { messages: true }
    })
    await this.auditService.log('APPEAL_CREATED', user.userId, 'Appeal', appeal.id)

    return appeal
  }

  async replyToAppeal(user: AuthUser, appealId: string, dto: ReplyAppealDto) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      include: { messages: true }
    })

    if (!appeal) {
      throw new NotFoundException('Обращение не найдено')
    }

    const isOrganizer = user.role === RoleName.ORGANIZER

    if (!isOrganizer && appeal.userId !== user.userId) {
      throw new ForbiddenException('Нет доступа к обращению')
    }

    const message = await this.prisma.appealMessage.create({
      data: {
        appealId,
        userId: user.userId,
        content: dto.message
      }
    })
    await this.auditService.log('APPEAL_REPLIED', user.userId, 'Appeal', appealId)

    if (appeal.status === AppealStatus.OPEN && isOrganizer) {
      await this.prisma.appeal.update({
        where: { id: appealId },
        data: { status: AppealStatus.IN_PROGRESS }
      })
    }

    return message
  }

  async closeAppeal(user: AuthUser, appealId: string) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId }
    })

    if (!appeal) {
      throw new NotFoundException('Обращение не найдено')
    }

    const isOrganizer = user.role === RoleName.ORGANIZER

    if (!isOrganizer && appeal.userId !== user.userId) {
      throw new ForbiddenException('Нет доступа к обращению')
    }

    const updated = await this.prisma.appeal.update({
      where: { id: appealId },
      data: { status: AppealStatus.CLOSED }
    })
    await this.auditService.log('APPEAL_CLOSED', user.userId, 'Appeal', appealId)
    return updated
  }
}
