import { AchievementStage, AgeStatus } from '@prisma/client'

export function calculateAge(birthDate: Date, today: Date = new Date()) {
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return age
}

export function calculateAgeStatus(age: number): AgeStatus {
  if (age >= 6 && age <= 10) {
    return AgeStatus.SCOUT
  }
  if (age >= 11 && age <= 13) {
    return AgeStatus.NAVIGATOR
  }
  if (age >= 14 && age <= 17) {
    return AgeStatus.NOVATOR
  }
  return AgeStatus.WANDERER
}

export function calculateAchievementStage(
  selectedGoals: number,
  achievedGoals: number
): AchievementStage | null {
  if (achievedGoals >= 216) {
    return AchievementStage.SUCCESS
  }
  if (achievedGoals >= 144) {
    return AchievementStage.EXPEDITION
  }
  if (achievedGoals >= 72) {
    return AchievementStage.ROUTE
  }
  if (achievedGoals >= 48) {
    return AchievementStage.TRAIL
  }
  if (achievedGoals >= 24) {
    return AchievementStage.PATH
  }
  if (selectedGoals >= 6) {
    return AchievementStage.START
  }
  return null
}
