import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  AchievementStage,
  BranchAwardType,
  GoalStatus,
  SpecialtyLevelName,
  SpecialtyStatus,
  UserStatus
} from '@prisma/client'
import { AwardBranchesDto } from './dto/award-branches.dto'
import { AuditService } from '../audit/audit.service'
import { calculateAchievementStage } from '../achievements/achievements.rules'

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

    const completedSpecialties = user.specialties.filter(
      (specialty) => specialty.status === SpecialtyStatus.COMPLETED
    )
    const logs = completedSpecialties.reduce((sum, specialty) => {
      const amount = LOG_AMOUNTS[specialty.level.name] ?? 0
      return sum + amount
    }, 0)

    const twigs = user.branchAwards.reduce((sum, award) => sum + award.amount, 0)

    return {
      acorns,
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
}
