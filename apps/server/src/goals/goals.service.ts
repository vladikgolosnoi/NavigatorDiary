import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SelectGoalsDto } from './dto/select-goals.dto'
import { addMonths } from './utils/date'
import { GoalStatus, RoleName } from '@prisma/client'
import { GoalProgressDto } from './dto/goal-progress.dto'
import { AuthUser } from './goals.types'
import { ChatService } from '../chat/chat.service'
import { AuditService } from '../audit/audit.service'
import { UpdateGoalCommentDto } from './dto/update-goal-comment.dto'

const MAX_PROGRESS_STEP = 5

function isDemoEmail(email?: string | null) {
  return Boolean(email && email.endsWith('@demo.local'))
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly auditService: AuditService
  ) {}

  async getSelectionInfo(userId: string) {
    const [user, latest] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      }),
      this.prisma.goalSelection.findFirst({
        where: { userId },
        orderBy: { selectedAt: 'desc' }
      })
    ])

    return {
      lastSelectedAt: latest?.selectedAt ?? null,
      nextEligibleAt: isDemoEmail(user?.email) ? null : (latest?.nextEligibleAt ?? null)
    }
  }

  async selectGoals(userId: string, dto: SelectGoalsDto) {
    const [user, existingSelection] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      }),
      this.prisma.goalSelection.findFirst({
        where: { userId },
        orderBy: { selectedAt: 'desc' }
      })
    ])

    const demoUser = isDemoEmail(user?.email)

    if (!demoUser && existingSelection && existingSelection.nextEligibleAt > new Date()) {
      throw new BadRequestException(
        `Повторный выбор целей доступен после ${existingSelection.nextEligibleAt.toISOString()}`
      )
    }

    const goals = await this.prisma.goal.findMany({
      where: { id: { in: dto.goalIds } }
    })

    if (goals.length !== dto.goalIds.length) {
      throw new NotFoundException('Некоторые цели не найдены')
    }

    if (demoUser) {
      await this.prisma.$transaction([
        this.prisma.goalReaction.deleteMany({
          where: {
            userGoal: {
              userId
            }
          }
        }),
        this.prisma.goalProgress.deleteMany({
          where: {
            userGoal: {
              userId
            }
          }
        }),
        this.prisma.userGoal.deleteMany({
          where: { userId }
        }),
        this.prisma.goalSelection.deleteMany({
          where: { userId }
        })
      ])
    }

    const selectedAt = new Date()
    const selection = await this.prisma.goalSelection.create({
      data: {
        userId,
        selectedAt,
        nextEligibleAt: demoUser ? selectedAt : addMonths(selectedAt, 3),
        goals: {
          create: dto.goalIds.map((goalId) => ({
            goalId,
            userId
          }))
        }
      },
      include: { goals: true }
    })

    return {
      selectionId: selection.id,
      selectedAt: selection.selectedAt,
      nextEligibleAt: selection.nextEligibleAt,
      goals: selection.goals
    }
  }

  async listMyGoals(userId: string) {
    const goals = await this.prisma.userGoal.findMany({
      where: { userId },
      include: {
        goal: { include: { activities: true } },
        progress: { orderBy: { createdAt: 'desc' }, take: 1 },
        reactions: true,
        _count: { select: { progress: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return goals.map((goal) => ({
      id: goal.id,
      status: goal.status,
      comment: goal.comment,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      confirmedAt: goal.confirmedAt,
      achievedAt: goal.achievedAt,
      reactionCount: goal.reactions.length,
      lastProgressAt: goal.progress[0]?.createdAt ?? null,
      progressCount: goal._count?.progress ?? 0,
      goal: goal.goal
    }))
  }

  async listTeamGoalsForVoting(user: AuthUser) {
    if (!user.teamId) {
      throw new BadRequestException('Команда не найдена')
    }

    const goals = await this.prisma.userGoal.findMany({
      where: {
        user: { teamId: user.teamId },
        userId: { not: user.userId },
        status: GoalStatus.PENDING_CONFIRMATION
      },
      include: {
        user: true,
        goal: true,
        reactions: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    return goals.map((goal) => ({
      id: goal.id,
      status: goal.status,
      reactionCount: goal.reactions.length,
      reacted: goal.reactions.some((reaction) => reaction.userId === user.userId),
      user: {
        id: goal.user.id,
        firstName: goal.user.firstName,
        lastName: goal.user.lastName
      },
      goal: {
        id: goal.goal.id,
        name: goal.goal.name
      }
    }))
  }

  async addProgress(user: AuthUser, userGoalId: string, dto: GoalProgressDto) {
    const userGoal = await this.prisma.userGoal.findUnique({
      where: { id: userGoalId },
      include: {
        progress: { orderBy: { createdAt: 'desc' }, take: 1 },
        user: true,
        goal: true
      }
    })

    if (!userGoal) {
      throw new NotFoundException('Цель не найдена')
    }

    if (userGoal.userId !== user.userId) {
      throw new ForbiddenException('Нельзя отмечать прогресс по чужой цели')
    }

    if (userGoal.status === GoalStatus.ACHIEVED) {
      throw new BadRequestException('Цель уже подтверждена как достигнутая')
    }

    const currentProgressCount = await this.prisma.goalProgress.count({
      where: { userGoalId: userGoal.id }
    })

    if (currentProgressCount >= MAX_PROGRESS_STEP || userGoal.status === GoalStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('Цель уже отмечена как достигнутая и ждёт подтверждения')
    }

    const lastProgressAt = userGoal.progress[0]?.createdAt
    if (lastProgressAt) {
      const diffMs = Date.now() - lastProgressAt.getTime()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      if (diffMs < weekMs) {
        throw new BadRequestException('Отмечать прогресс можно не чаще 1 раза в неделю')
      }
    }

    const nextProgressStep = currentProgressCount + 1
    if (dto.step && dto.step !== nextProgressStep) {
      throw new BadRequestException('Можно отметить только следующий шаг прогресса')
    }

    const progress = await this.prisma.goalProgress.create({
      data: {
        userGoalId: userGoal.id,
        note: dto.note
      }
    })
    await this.auditService.log('GOAL_PROGRESS', user.userId, 'UserGoalProgress', progress.id, {
      userGoalId: userGoal.id,
      step: nextProgressStep
    })

    if (nextProgressStep >= MAX_PROGRESS_STEP) {
      await this.prisma.userGoal.update({
        where: { id: userGoal.id },
        data: { status: GoalStatus.PENDING_CONFIRMATION }
      })

      const displayName = `${userGoal.user.lastName} ${userGoal.user.firstName}`
      const message = `${displayName} отметил цель ${userGoal.goal.name} достигнутой`
      if (userGoal.user.teamId) {
        await this.chatService.createSystemMessage(userGoal.user.teamId, message)
      }
    } else if (userGoal.status === GoalStatus.SELECTED) {
      await this.prisma.userGoal.update({
        where: { id: userGoal.id },
        data: { status: GoalStatus.IN_PROGRESS }
      })
    }

    return progress
  }

  async updateComment(user: AuthUser, userGoalId: string, dto: UpdateGoalCommentDto) {
    const userGoal = await this.prisma.userGoal.findUnique({
      where: { id: userGoalId }
    })

    if (!userGoal) {
      throw new NotFoundException('Цель не найдена')
    }

    if (userGoal.userId !== user.userId) {
      throw new ForbiddenException('Нельзя изменять комментарий чужой цели')
    }

    return this.prisma.userGoal.update({
      where: { id: userGoalId },
      data: { comment: dto.comment ?? '' }
    })
  }

  async reactToGoal(user: AuthUser, userGoalId: string) {
    const userGoal = await this.prisma.userGoal.findUnique({
      where: { id: userGoalId },
      include: { user: true, reactions: true, goal: true }
    })

    if (!userGoal) {
      throw new NotFoundException('Цель не найдена')
    }

    if (userGoal.userId === user.userId) {
      throw new ForbiddenException('Нельзя голосовать за свою цель')
    }

    if (!user.teamId || userGoal.user.teamId !== user.teamId) {
      throw new ForbiddenException('Нельзя голосовать за цели другой команды')
    }

    if (userGoal.status !== GoalStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('Поддержка доступна после отметки цели как достигнутой')
    }

    const alreadyReacted = await this.prisma.goalReaction.findUnique({
      where: { userGoalId_userId: { userGoalId, userId: user.userId } }
    })

    if (alreadyReacted) {
      throw new BadRequestException('Вы уже проголосовали за эту цель')
    }

    await this.prisma.goalReaction.create({
      data: {
        userGoalId,
        userId: user.userId
      }
    })
    await this.auditService.log('GOAL_REACTED', user.userId, 'UserGoal', userGoalId, {
      userId: user.userId
    })

    const reactionCount = userGoal.reactions.length + 1

    return { reactionCount }
  }

  async confirmGoal(user: AuthUser, userGoalId: string) {
    const userGoal = await this.prisma.userGoal.findUnique({
      where: { id: userGoalId },
      include: { user: true, reactions: true, goal: true }
    })

    if (!userGoal) {
      throw new NotFoundException('Цель не найдена')
    }

    if (user.role === RoleName.LEADER && userGoal.user.teamId !== user.teamId) {
      throw new ForbiddenException('Нельзя подтверждать цели другой команды')
    }

    const reactionCount = userGoal.reactions.length
    if (reactionCount < 5) {
      throw new BadRequestException('Недостаточно реакций для подтверждения цели')
    }

    if (userGoal.status === GoalStatus.ACHIEVED) {
      return userGoal
    }

    const updated = await this.prisma.userGoal.update({
      where: { id: userGoal.id },
      data: {
        status: GoalStatus.ACHIEVED,
        confirmedAt: new Date(),
        confirmedById: user.userId,
        achievedAt: new Date()
      }
    })
    await this.auditService.log('GOAL_CONFIRMED', user.userId, 'UserGoal', userGoalId, {
      confirmedById: user.userId
    })
    const displayName = `${userGoal.user.lastName} ${userGoal.user.firstName}`
    const message = `${displayName} получил подтверждение по цели ${userGoal.goal.name}`
    if (userGoal.user.teamId) {
      await this.chatService.createSystemMessage(userGoal.user.teamId, message)
    }
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

    const goals = await this.prisma.userGoal.findMany({
      where: {
        status: GoalStatus.PENDING_CONFIRMATION,
        user: filterTeamId ? { teamId: filterTeamId } : undefined
      },
      include: {
        user: true,
        goal: true,
        reactions: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    return goals.map((goal) => ({
      id: goal.id,
      user: {
        id: goal.user.id,
        firstName: goal.user.firstName,
        lastName: goal.user.lastName,
        teamId: goal.user.teamId
      },
      goal: {
        id: goal.goal.id,
        name: goal.goal.name
      },
      reactionCount: goal.reactions.length,
      updatedAt: goal.updatedAt
    }))
  }
}
