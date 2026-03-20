import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  AchievementStage,
  BeaverResourceType,
  BranchAwardType,
  GoalStatus,
  SpecialtyLevelName,
  SpecialtyStatus,
  UserStatus
} from '@prisma/client'
import { AwardBranchesDto } from './dto/award-branches.dto'
import { AuditService } from '../audit/audit.service'
import { calculateAchievementStage } from '../achievements/achievements.rules'
import { AdjustResourceDto } from './dto/adjust-resource.dto'

const BRANCH_AWARD_AMOUNTS: Record<BranchAwardType, number> = {
  [BranchAwardType.PARTICIPATION]: 10,
  [BranchAwardType.ACTIVE_PARTICIPATION]: 15,
  [BranchAwardType.WIN]: 20
}

const LOG_AMOUNTS: Record<SpecialtyLevelName, number> = {
  [SpecialtyLevelName.BRONZE]: 10,
  [SpecialtyLevelName.SILVER]: 20,
  [SpecialtyLevelName.GOLD]: 30
}

const ACORN_STAGE_AMOUNTS: Record<AchievementStage, number> = {
  [AchievementStage.START]: 6,
  [AchievementStage.PATH]: 24,
  [AchievementStage.TRAIL]: 48,
  [AchievementStage.ROUTE]: 72,
  [AchievementStage.EXPEDITION]: 144,
  [AchievementStage.SUCCESS]: 216
}

const RESOURCE_LABELS: Record<BeaverResourceType, string> = {
  [BeaverResourceType.ACORN]: 'Веточки',
  [BeaverResourceType.TWIG]: 'Жёлуди',
  [BeaverResourceType.LOG]: 'Поленья'
}

@Injectable()
export class BeaverHutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getMyHut(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGoals: true,
        specialties: {
          include: {
            level: true,
            specialty: true
          }
        },
        branchAwards: {
          orderBy: { createdAt: 'desc' },
          include: {
            organizer: true
          }
        },
        resourceAdjustments: {
          orderBy: { createdAt: 'desc' },
          include: {
            organizer: true
          }
        }
      }
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    const achievedGoalsCount = user.userGoals.filter((goal) => goal.status === GoalStatus.ACHIEVED)
      .length
    const selectedGoalsCount = user.userGoals.length
    const stage = calculateAchievementStage(selectedGoalsCount, achievedGoalsCount)
    const acorns = stage ? ACORN_STAGE_AMOUNTS[stage] : 0
    const acornAdjustments = user.resourceAdjustments
      .filter((adjustment) => adjustment.resourceType === BeaverResourceType.ACORN)
      .reduce((sum, adjustment) => sum + adjustment.amount, 0)

    const completedSpecialties = user.specialties.filter(
      (specialty) => specialty.status === SpecialtyStatus.COMPLETED
    )
    const logsBase = completedSpecialties.reduce((sum, specialty) => {
      const amount = LOG_AMOUNTS[specialty.level.name] ?? 0
      return sum + amount
    }, 0)
    const logAdjustments = user.resourceAdjustments
      .filter((adjustment) => adjustment.resourceType === BeaverResourceType.LOG)
      .reduce((sum, adjustment) => sum + adjustment.amount, 0)

    const twigsBase = user.branchAwards.reduce((sum, award) => sum + award.amount, 0)
    const twigAdjustments = user.resourceAdjustments
      .filter((adjustment) => adjustment.resourceType === BeaverResourceType.TWIG)
      .reduce((sum, adjustment) => sum + adjustment.amount, 0)

    const twigs = twigsBase + twigAdjustments
    const logs = logsBase + logAdjustments

    return {
      acorns: acorns + acornAdjustments,
      twigs,
      logs,
      achievedGoalsCount,
      completedSpecialties: completedSpecialties.map((spec) => ({
        id: spec.id,
        specialty: spec.specialty.name,
        level: spec.level.name,
        completedAt: spec.completedAt
      })),
      twigAwards: user.branchAwards.map((award) => ({
        id: award.id,
        type: award.type,
        amount: award.amount,
        note: award.note,
        createdAt: award.createdAt,
        organizer: award.organizer
          ? `${award.organizer.lastName} ${award.organizer.firstName}`
          : null
      })),
      adjustments: user.resourceAdjustments.map((adjustment) => ({
        id: adjustment.id,
        resourceType: adjustment.resourceType,
        amount: adjustment.amount,
        note: adjustment.note,
        createdAt: adjustment.createdAt,
        organizer: adjustment.organizer
          ? `${adjustment.organizer.lastName} ${adjustment.organizer.firstName}`
          : null
      }))
    }
  }

  async awardBranches(organizerId: string, dto: AwardBranchesDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
      include: {
        users: {
          where: { status: UserStatus.ACTIVE }
        }
      }
    })

    if (!team) {
      throw new NotFoundException('Команда не найдена')
    }

    const recipients = dto.userIds?.length
      ? team.users.filter((user) => dto.userIds?.includes(user.id))
      : team.users

    if (recipients.length === 0) {
      throw new BadRequestException('Не найдено участников для начисления веточек')
    }

    const amount = BRANCH_AWARD_AMOUNTS[dto.type]

    await this.prisma.branchAward.createMany({
      data: recipients.map((user) => ({
        userId: user.id,
        teamId: team.id,
        organizerId,
        type: dto.type,
        amount,
        note: dto.note
      }))
    })

    await this.auditService.log('BRANCH_AWARD', organizerId, 'Team', team.id, {
      type: dto.type,
      amount,
      count: recipients.length
    })

    return {
      awarded: recipients.length,
      amount
    }
  }

  async adjustResource(organizerId: string, dto: AdjustResourceDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { team: true }
    })

    if (!user) {
      throw new NotFoundException('Участник не найден')
    }

    const adjustment = await this.prisma.beaverResourceAdjustment.create({
      data: {
        userId: user.id,
        organizerId,
        resourceType: dto.resourceType,
        amount: dto.amount,
        note: dto.note?.trim() || undefined
      },
      include: {
        organizer: true
      }
    })

    await this.auditService.log('BEAVER_RESOURCE_ADJUSTED', organizerId, 'User', user.id, {
      resourceType: dto.resourceType,
      amount: dto.amount
    })

    return {
      id: adjustment.id,
      resourceType: adjustment.resourceType,
      amount: adjustment.amount,
      note: adjustment.note,
      createdAt: adjustment.createdAt,
      resourceLabel: RESOURCE_LABELS[adjustment.resourceType],
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }
  }
}
