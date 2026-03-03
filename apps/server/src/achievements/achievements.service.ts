import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AchievementStage, GoalStatus } from '@prisma/client'
import { calculateAchievementStage, calculateAge, calculateAgeStatus } from './achievements.rules'

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGoals: true,
        specialties: {
          include: {
            specialty: true,
            level: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    const age = calculateAge(user.birthDate)
    const ageStatus = calculateAgeStatus(age)

    const selectedGoalsCount = user.userGoals.length
    const achievedGoalsCount = user.userGoals.filter((goal) => goal.status === GoalStatus.ACHIEVED)
      .length

    const stage = calculateAchievementStage(selectedGoalsCount, achievedGoalsCount)

    const achievement = await this.prisma.achievement.upsert({
      where: { userId },
      update: {
        ageStatus,
        stage: stage ?? AchievementStage.START,
        goalsAchievedCount: achievedGoalsCount
      },
      create: {
        userId,
        ageStatus,
        stage: stage ?? AchievementStage.START,
        goalsAchievedCount: achievedGoalsCount
      }
    })

    return {
      age,
      ageStatus: achievement.ageStatus,
      stage: achievement.stage,
      goalsAchievedCount: achievement.goalsAchievedCount,
      specialties: user.specialties.map((specialty) => ({
        id: specialty.id,
        status: specialty.status,
        specialty: specialty.specialty.name,
        level: specialty.level.name
      }))
    }
  }
}
