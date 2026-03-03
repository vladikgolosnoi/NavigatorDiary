import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SelectSpecialtyDto } from './dto/select-specialty.dto'
import { ChecklistItemDto } from './dto/checklist-item.dto'
import { NotificationScope, RoleName, SpecialtyLevelName, SpecialtyStatus } from '@prisma/client'
import { AuthUser } from '../goals/goals.types'
import { ChatService } from '../chat/chat.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class SpecialtiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly auditService: AuditService
  ) {}

  async getMySpecialty(userId: string) {
    const active = await this.prisma.userSpecialty.findFirst({
      where: { userId, status: SpecialtyStatus.ACTIVE },
      include: {
        specialty: {
          include: {
            resources: true
          }
        },
        level: {
          include: {
            checklist: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        checklist: true
      }
    })

    if (!active) {
      return null
    }

    const checkedIds = new Set(active.checklist.map((item) => item.checklistItemId))

    return {
      id: active.id,
      status: active.status,
      startedAt: active.startedAt,
      completedAt: active.completedAt,
      confirmedAt: active.confirmedAt,
      specialty: active.specialty,
      level: active.level,
      checklistProgress: active.level.checklist.map((item) => ({
        ...item,
        checked: checkedIds.has(item.id)
      }))
    }
  }

  async selectSpecialty(userId: string, dto: SelectSpecialtyDto) {
    const existing = await this.prisma.userSpecialty.findFirst({
      where: { userId, status: SpecialtyStatus.ACTIVE }
    })

    if (existing) {
      throw new BadRequestException('У вас уже есть активная специальность')
    }

    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
      include: { levels: true }
    })

    if (!specialty) {
      throw new NotFoundException('Специальность не найдена')
    }

    const level = await this.prisma.specialtyLevel.findUnique({
      where: { id: dto.levelId }
    })

    if (!level || level.specialtyId !== specialty.id) {
      throw new BadRequestException('Уровень не соответствует выбранной специальности')
    }

    return this.prisma.userSpecialty.create({
      data: {
        userId,
        specialtyId: specialty.id,
        levelId: level.id,
        status: SpecialtyStatus.ACTIVE
      }
    })
  }

  async checkChecklistItem(user: AuthUser, userSpecialtyId: string, dto: ChecklistItemDto) {
    const userSpecialty = await this.prisma.userSpecialty.findUnique({
      where: { id: userSpecialtyId },
      include: {
        level: { include: { checklist: true } },
        user: true,
        specialty: true
      }
    })

    if (!userSpecialty) {
      throw new NotFoundException('Специальность не найдена')
    }

    if (userSpecialty.userId !== user.userId) {
      throw new ForbiddenException('Нельзя отмечать чек-лист другой специальности')
    }

    if (userSpecialty.status !== SpecialtyStatus.ACTIVE) {
      throw new BadRequestException('Специальность не активна')
    }

    const allowed = userSpecialty.level.checklist.some((item) => item.id === dto.checklistItemId)
    if (!allowed) {
      throw new BadRequestException('Пункт чек-листа не принадлежит этому уровню')
    }

    const alreadyChecked = await this.prisma.userSpecialtyChecklist.findUnique({
      where: {
        userSpecialtyId_checklistItemId: {
          userSpecialtyId,
          checklistItemId: dto.checklistItemId
        }
      }
    })

    if (alreadyChecked) {
      throw new BadRequestException('Этот пункт чек-листа уже отмечен')
    }

    await this.prisma.userSpecialtyChecklist.create({
      data: {
        userSpecialtyId,
        checklistItemId: dto.checklistItemId
      }
    })
    await this.auditService.log('SPECIALTY_CHECKED', user.userId, 'UserSpecialty', userSpecialtyId, {
      checklistItemId: dto.checklistItemId
    })

    const total = userSpecialty.level.checklist.length
    const checkedCount = await this.prisma.userSpecialtyChecklist.count({
      where: { userSpecialtyId }
    })

    if (checkedCount >= total) {
      await this.prisma.userSpecialty.update({
        where: { id: userSpecialty.id },
        data: { completedAt: new Date() }
      })
      if (userSpecialty.user?.teamId && userSpecialty.specialty) {
        const displayName = `${userSpecialty.user.lastName} ${userSpecialty.user.firstName}`
        const message = `${displayName} отметил все пункты чек-листа по специальности ${userSpecialty.specialty.name}`
        await this.chatService.createSystemMessage(userSpecialty.user.teamId, message)
      }
      const needsOrganizer =
        userSpecialty.level.name === SpecialtyLevelName.SILVER ||
        userSpecialty.level.name === SpecialtyLevelName.GOLD
      if (needsOrganizer) {
        const displayName = `${userSpecialty.user.lastName} ${userSpecialty.user.firstName}`
        await this.prisma.notification.create({
          data: {
            title: 'Нужно подтверждение специальности',
            body: `${displayName} завершил(а) чек-лист по специальности «${userSpecialty.specialty.name}» (${userSpecialty.level.name}).`,
            scope: NotificationScope.ORGANIZERS,
            createdById: user.userId
          }
        })
        await this.auditService.log('SPECIALTY_NOTIFY_ORGANIZER', user.userId, 'UserSpecialty', userSpecialty.id)
      }
    }

    return { checkedCount, total }
  }

  async confirmSpecialty(user: AuthUser, userSpecialtyId: string) {
    const userSpecialty = await this.prisma.userSpecialty.findUnique({
      where: { id: userSpecialtyId },
      include: { level: true, checklist: true, user: true }
    })

    if (!userSpecialty) {
      throw new NotFoundException('Специальность не найдена')
    }

    if (userSpecialty.status !== SpecialtyStatus.ACTIVE) {
      throw new BadRequestException('Специальность не активна')
    }

    const checklistTotal = await this.prisma.specialtyChecklistItem.count({
      where: { levelId: userSpecialty.levelId }
    })

    if (userSpecialty.checklist.length < checklistTotal) {
      throw new BadRequestException('Не все пункты чек-листа отмечены')
    }

    const needsOrganizer =
      userSpecialty.level.name === SpecialtyLevelName.SILVER ||
      userSpecialty.level.name === SpecialtyLevelName.GOLD

    if (needsOrganizer && user.role !== RoleName.ORGANIZER) {
      throw new ForbiddenException('Подтверждение доступно только организатору')
    }

    if (!needsOrganizer && user.role !== RoleName.LEADER) {
      throw new ForbiddenException('Подтверждение доступно только руководителю')
    }

    if (!needsOrganizer && userSpecialty.user.teamId !== user.teamId) {
      throw new ForbiddenException('Нельзя подтверждать специальности другой команды')
    }

    const updated = await this.prisma.userSpecialty.update({
      where: { id: userSpecialty.id },
      data: {
        status: SpecialtyStatus.COMPLETED,
        confirmedAt: new Date(),
        confirmedById: user.userId
      }
    })
    await this.auditService.log('SPECIALTY_CONFIRMED', user.userId, 'UserSpecialty', userSpecialtyId, {
      confirmedById: user.userId
    })
    return updated
  }

  async listPendingConfirmations(user: AuthUser, teamId?: string | null) {
    let filterTeamId = teamId ?? null
    if (user.role === RoleName.LEADER) {
      if (!user.teamId) {
        throw new BadRequestException('Команда не найдена')
      }
      filterTeamId = user.teamId
    }

    const levelFilter =
      user.role === RoleName.LEADER
        ? [SpecialtyLevelName.BRONZE]
        : [SpecialtyLevelName.SILVER, SpecialtyLevelName.GOLD]

    const specialties = await this.prisma.userSpecialty.findMany({
      where: {
        status: SpecialtyStatus.ACTIVE,
        completedAt: { not: null },
        confirmedAt: null,
        level: { name: { in: levelFilter } },
        user: filterTeamId ? { teamId: filterTeamId } : undefined
      },
      include: {
        user: true,
        specialty: true,
        level: true
      },
      orderBy: { completedAt: 'desc' }
    })

    return specialties.map((item) => ({
      id: item.id,
      completedAt: item.completedAt,
      user: {
        id: item.user.id,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        teamId: item.user.teamId
      },
      specialty: {
        id: item.specialty.id,
        name: item.specialty.name
      },
      level: {
        id: item.level.id,
        name: item.level.name
      }
    }))
  }
}
