import { Injectable } from '@nestjs/common'
import { GoalStatus, RoleName, SpecialtyLevelName, SpecialtyStatus, TeamStatus, UserStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const roleLabels: Record<RoleName, string> = {
  ORGANIZER: 'Организатор',
  LEADER: 'Руководитель',
  NAVIGATOR: 'Навигатор'
}

const goalStatusLabels: Record<GoalStatus, string> = {
  SELECTED: 'Выбрана',
  IN_PROGRESS: 'В процессе',
  PENDING_CONFIRMATION: 'На подтверждении',
  ACHIEVED: 'Достигнута'
}

const specialtyStatusLabels: Record<SpecialtyStatus, string> = {
  ACTIVE: 'В работе',
  COMPLETED: 'Освоена',
  CANCELLED: 'Снята'
}

const specialtyLevelLabels: Record<SpecialtyLevelName, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

type TeamSummary = {
  teamId: string
  teamName: string
  city: string
  institution: string
  membersTotal: number
  navigatorsTotal: number
  leadersTotal: number
  goalsSelected: number
  goalsAchieved: number
  specialtiesSelected: number
  specialtiesCompleted: number
  uniqueSpecialties: Set<string>
}

type UserSummary = {
  userId: string
  fullName: string
  teamName: string
  role: string
  goalsSelected: number
  goalsAchieved: number
  specialtiesSelected: number
  specialtiesCompleted: number
}

type AnalyticsFilters = {
  teamId?: string | null
  role?: RoleName | null
  goalStatus?: GoalStatus | null
  specialtyStatus?: SpecialtyStatus | null
  specialtyLevel?: SpecialtyLevelName | null
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value)
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [headers.map(csvEscape).join(';'), ...rows.map((row) => row.map(csvEscape).join(';'))].join('\n')
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString() : ''
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeFilters(filters?: AnalyticsFilters): Required<AnalyticsFilters> {
    return {
      teamId: filters?.teamId ?? null,
      role: filters?.role ?? null,
      goalStatus: filters?.goalStatus ?? null,
      specialtyStatus: filters?.specialtyStatus ?? null,
      specialtyLevel: filters?.specialtyLevel ?? null
    }
  }

  private async loadAnalyticsData(filters?: AnalyticsFilters) {
    const normalized = this.normalizeFilters(filters)
    const activeTeamFilter = {
      team: { status: TeamStatus.ACTIVE },
      status: UserStatus.ACTIVE,
      teamId: normalized.teamId ?? { not: null as string | null },
      ...(normalized.role ? { role: { name: normalized.role } } : {})
    }

    const [teams, users, goals, specialties] = await Promise.all([
      this.prisma.team.findMany({
        where: {
          status: TeamStatus.ACTIVE,
          ...(normalized.teamId ? { id: normalized.teamId } : {})
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          city: true,
          institution: true
        }
      }),
      this.prisma.user.findMany({
        where: activeTeamFilter,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: { select: { name: true } },
          team: {
            select: {
              id: true,
              name: true,
              city: true,
              institution: true
            }
          }
        }
      }),
      this.prisma.userGoal.findMany({
        where: {
          user: activeTeamFilter,
          ...(normalized.goalStatus ? { status: normalized.goalStatus } : {})
        },
        orderBy: [{ user: { lastName: 'asc' } }, { createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          achievedAt: true,
          confirmedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true } },
              team: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  institution: true
                }
              }
            }
          },
          goal: {
            select: {
              id: true,
              name: true,
              competency: {
                select: {
                  name: true,
                  sphere: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          reactions: {
            select: { id: true }
          },
          progress: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
          }
        }
      }),
      this.prisma.userSpecialty.findMany({
        where: {
          user: activeTeamFilter,
          status: normalized.specialtyStatus
            ? normalized.specialtyStatus
            : { in: [SpecialtyStatus.ACTIVE, SpecialtyStatus.COMPLETED] },
          ...(normalized.specialtyLevel ? { level: { name: normalized.specialtyLevel } } : {})
        },
        orderBy: [{ user: { lastName: 'asc' } }, { startedAt: 'desc' }],
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          confirmedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true } },
              team: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  institution: true
                }
              }
            }
          },
          specialty: {
            select: { name: true }
          },
          level: {
            select: {
              name: true,
              checklist: {
                select: { id: true }
              }
            }
          },
          checklist: {
            select: { id: true }
          }
        }
      })
    ])

    return { teams, users, goals, specialties, filters: normalized }
  }

  async getOrganizerOverview(filters?: AnalyticsFilters) {
    const { teams, users, goals, specialties, filters: normalized } = await this.loadAnalyticsData(filters)

    const teamMap = new Map<string, TeamSummary>()
    teams.forEach((team) => {
      teamMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        city: team.city,
        institution: team.institution,
        membersTotal: 0,
        navigatorsTotal: 0,
        leadersTotal: 0,
        goalsSelected: 0,
        goalsAchieved: 0,
        specialtiesSelected: 0,
        specialtiesCompleted: 0,
        uniqueSpecialties: new Set<string>()
      })
    })

    const userMap = new Map<string, UserSummary>()

    users.forEach((user) => {
      if (!user.team) {
        return
      }
      const fullName = `${user.lastName} ${user.firstName}`.trim()
      userMap.set(user.id, {
        userId: user.id,
        fullName,
        teamName: user.team.name,
        role: roleLabels[user.role.name],
        goalsSelected: 0,
        goalsAchieved: 0,
        specialtiesSelected: 0,
        specialtiesCompleted: 0
      })

      const teamSummary = teamMap.get(user.team.id)
      if (!teamSummary) {
        return
      }
      teamSummary.membersTotal += 1
      if (user.role.name === RoleName.NAVIGATOR) {
        teamSummary.navigatorsTotal += 1
      }
      if (user.role.name === RoleName.LEADER) {
        teamSummary.leadersTotal += 1
      }
    })

    const specialtyBreakdownMap = new Map<
      string,
      {
        specialtyName: string
        level: string
        usersTotal: number
        teams: Set<string>
      }
    >()

    goals.forEach((goal) => {
      if (!goal.user.team) {
        return
      }
      const teamSummary = teamMap.get(goal.user.team.id)
      const userSummary = userMap.get(goal.user.id)
      if (teamSummary) {
        teamSummary.goalsSelected += 1
        if (goal.status === GoalStatus.ACHIEVED) {
          teamSummary.goalsAchieved += 1
        }
      }
      if (userSummary) {
        userSummary.goalsSelected += 1
        if (goal.status === GoalStatus.ACHIEVED) {
          userSummary.goalsAchieved += 1
        }
      }
    })

    specialties.forEach((specialty) => {
      if (!specialty.user.team) {
        return
      }
      const teamSummary = teamMap.get(specialty.user.team.id)
      const userSummary = userMap.get(specialty.user.id)
      const level = specialtyLevelLabels[specialty.level.name]
      const key = `${specialty.specialty.name}::${level}`

      if (teamSummary) {
        teamSummary.specialtiesSelected += 1
        if (specialty.status === SpecialtyStatus.COMPLETED) {
          teamSummary.specialtiesCompleted += 1
        }
        teamSummary.uniqueSpecialties.add(specialty.specialty.name)
      }
      if (userSummary) {
        userSummary.specialtiesSelected += 1
        if (specialty.status === SpecialtyStatus.COMPLETED) {
          userSummary.specialtiesCompleted += 1
        }
      }

      const bucket = specialtyBreakdownMap.get(key) ?? {
        specialtyName: specialty.specialty.name,
        level,
        usersTotal: 0,
        teams: new Set<string>()
      }
      bucket.usersTotal += 1
      bucket.teams.add(specialty.user.team.name)
      specialtyBreakdownMap.set(key, bucket)
    })

    const teamStats = Array.from(teamMap.values()).sort((left, right) => {
      if (right.goalsAchieved !== left.goalsAchieved) {
        return right.goalsAchieved - left.goalsAchieved
      }
      return left.teamName.localeCompare(right.teamName, 'ru')
    })

    return {
      generatedAt: new Date().toISOString(),
      filters: normalized,
      summary: {
        teamsTotal: teamStats.length,
        activeUsersTotal: users.length,
        navigatorsTotal: users.filter((user) => user.role.name === RoleName.NAVIGATOR).length,
        leadersTotal: users.filter((user) => user.role.name === RoleName.LEADER).length,
        goalsSelectedTotal: goals.length,
        goalsAchievedTotal: goals.filter((goal) => goal.status === GoalStatus.ACHIEVED).length,
        specialtiesSelectedTotal: specialties.length,
        specialtiesCompletedTotal: specialties.filter((item) => item.status === SpecialtyStatus.COMPLETED).length
      },
      teamStats: teamStats.map((team) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        city: team.city,
        institution: team.institution,
        membersTotal: team.membersTotal,
        navigatorsTotal: team.navigatorsTotal,
        leadersTotal: team.leadersTotal,
        goalsSelected: team.goalsSelected,
        goalsAchieved: team.goalsAchieved,
        specialtiesSelected: team.specialtiesSelected,
        specialtiesCompleted: team.specialtiesCompleted,
        uniqueSpecialties: Array.from(team.uniqueSpecialties).sort((left, right) => left.localeCompare(right, 'ru'))
      })),
      specialtyBreakdown: Array.from(specialtyBreakdownMap.values())
        .sort((left, right) => {
          if (right.usersTotal !== left.usersTotal) {
            return right.usersTotal - left.usersTotal
          }
          return left.specialtyName.localeCompare(right.specialtyName, 'ru')
        })
        .map((item) => ({
          specialtyName: item.specialtyName,
          level: item.level,
          usersTotal: item.usersTotal,
          teams: Array.from(item.teams).sort((left, right) => left.localeCompare(right, 'ru'))
        })),
      goalStatusBreakdown: Object.values(GoalStatus).map((status) => ({
        status,
        label: goalStatusLabels[status],
        count: goals.filter((goal) => goal.status === status).length
      })),
      specialtyStatusBreakdown: Object.values(SpecialtyStatus).map((status) => ({
        status,
        label: specialtyStatusLabels[status],
        count: specialties.filter((specialty) => specialty.status === status).length
      })),
      specialtyLevelBreakdown: Object.values(SpecialtyLevelName).map((level) => ({
        level,
        label: specialtyLevelLabels[level],
        count: specialties.filter((specialty) => specialty.level.name === level).length
      })),
      userStats: Array.from(userMap.values())
        .sort((left, right) => {
          if (right.goalsAchieved !== left.goalsAchieved) {
            return right.goalsAchieved - left.goalsAchieved
          }
          if (right.specialtiesCompleted !== left.specialtiesCompleted) {
            return right.specialtiesCompleted - left.specialtiesCompleted
          }
          return left.fullName.localeCompare(right.fullName, 'ru')
        })
        .slice(0, 12),
      goalRows: goals.slice(0, 12).map((goal) => ({
        id: goal.id,
        userId: goal.user.id,
        fullName: `${goal.user.lastName} ${goal.user.firstName}`.trim(),
        teamName: goal.user.team?.name ?? '',
        role: roleLabels[goal.user.role.name],
        goalName: goal.goal.name,
        competencyName: goal.goal.competency.name,
        sphereName: goal.goal.competency.sphere.name,
        status: goal.status,
        statusLabel: goalStatusLabels[goal.status],
        reactions: goal.reactions.length,
        lastProgressAt: formatDate(goal.progress[0]?.createdAt),
        achievedAt: formatDate(goal.achievedAt),
        confirmedAt: formatDate(goal.confirmedAt)
      })),
      specialtyRows: specialties.slice(0, 12).map((specialty) => ({
        id: specialty.id,
        userId: specialty.user.id,
        fullName: `${specialty.user.lastName} ${specialty.user.firstName}`.trim(),
        teamName: specialty.user.team?.name ?? '',
        role: roleLabels[specialty.user.role.name],
        specialtyName: specialty.specialty.name,
        level: specialty.level.name,
        levelLabel: specialtyLevelLabels[specialty.level.name],
        status: specialty.status,
        statusLabel: specialtyStatusLabels[specialty.status],
        checklistDone: specialty.checklist.length,
        checklistTotal: specialty.level.checklist.length,
        startedAt: formatDate(specialty.startedAt),
        completedAt: formatDate(specialty.completedAt),
        confirmedAt: formatDate(specialty.confirmedAt)
      }))
    }
  }

  async exportTeamSummaryCsv(filters?: AnalyticsFilters) {
    const overview = await this.getOrganizerOverview(filters)
    return buildCsv(
      [
        'Команда',
        'Город',
        'Учреждение',
        'Участников',
        'Навигаторов',
        'Руководителей',
        'Целей выбрано',
        'Целей достигнуто',
        'Специальностей выбрано',
        'Специальностей подтверждено',
        'Выбранные специальности'
      ],
      overview.teamStats.map((team) => [
        team.teamName,
        team.city,
        team.institution,
        team.membersTotal,
        team.navigatorsTotal,
        team.leadersTotal,
        team.goalsSelected,
        team.goalsAchieved,
        team.specialtiesSelected,
        team.specialtiesCompleted,
        team.uniqueSpecialties.join(', ')
      ])
    )
  }

  async exportGoalsCsv(filters?: AnalyticsFilters) {
    const { goals } = await this.loadAnalyticsData(filters)

    return buildCsv(
      [
        'Команда',
        'Роль',
        'Пользователь',
        'Email',
        'Сфера',
        'Компетентность',
        'Цель',
        'Статус',
        'Реакций',
        'Последний прогресс',
        'Достигнута',
        'Подтверждена'
      ],
      goals.map((goal) => [
        goal.user.team?.name ?? '',
        roleLabels[goal.user.role.name],
        `${goal.user.lastName} ${goal.user.firstName}`.trim(),
        goal.user.email ?? '',
        goal.goal.competency.sphere.name,
        goal.goal.competency.name,
        goal.goal.name,
        goalStatusLabels[goal.status],
        goal.reactions.length,
        formatDate(goal.progress[0]?.createdAt),
        formatDate(goal.achievedAt),
        formatDate(goal.confirmedAt)
      ])
    )
  }

  async exportSpecialtiesCsv(filters?: AnalyticsFilters) {
    const { specialties } = await this.loadAnalyticsData(filters)

    return buildCsv(
      [
        'Команда',
        'Роль',
        'Пользователь',
        'Email',
        'Специальность',
        'Уровень',
        'Статус',
        'Чек-лист выполнен',
        'Всего пунктов',
        'Начата',
        'Завершена',
        'Подтверждена'
      ],
      specialties.map((specialty) => [
        specialty.user.team?.name ?? '',
        roleLabels[specialty.user.role.name],
        `${specialty.user.lastName} ${specialty.user.firstName}`.trim(),
        specialty.user.email ?? '',
        specialty.specialty.name,
        specialtyLevelLabels[specialty.level.name],
        specialtyStatusLabels[specialty.status],
        specialty.checklist.length,
        specialty.level.checklist.length,
        formatDate(specialty.startedAt),
        formatDate(specialty.completedAt),
        formatDate(specialty.confirmedAt)
      ])
    )
  }
}
