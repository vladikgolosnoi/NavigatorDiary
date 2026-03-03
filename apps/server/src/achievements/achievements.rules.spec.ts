import { AchievementStage, AgeStatus } from '@prisma/client'
import { calculateAchievementStage, calculateAge, calculateAgeStatus } from './achievements.rules'

describe('achievements rules', () => {
  it('calculates age with birthday not yet reached', () => {
    const birthDate = new Date(2012, 6, 10)
    const today = new Date(2024, 6, 9)
    expect(calculateAge(birthDate, today)).toBe(11)
  })

  it('maps age to age status', () => {
    expect(calculateAgeStatus(6)).toBe(AgeStatus.SCOUT)
    expect(calculateAgeStatus(10)).toBe(AgeStatus.SCOUT)
    expect(calculateAgeStatus(11)).toBe(AgeStatus.NAVIGATOR)
    expect(calculateAgeStatus(13)).toBe(AgeStatus.NAVIGATOR)
    expect(calculateAgeStatus(14)).toBe(AgeStatus.NOVATOR)
    expect(calculateAgeStatus(17)).toBe(AgeStatus.NOVATOR)
    expect(calculateAgeStatus(18)).toBe(AgeStatus.WANDERER)
  })

  it('maps goals to achievement stage', () => {
    expect(calculateAchievementStage(0, 0)).toBeNull()
    expect(calculateAchievementStage(6, 0)).toBe(AchievementStage.START)
    expect(calculateAchievementStage(6, 24)).toBe(AchievementStage.PATH)
    expect(calculateAchievementStage(6, 48)).toBe(AchievementStage.TRAIL)
    expect(calculateAchievementStage(6, 72)).toBe(AchievementStage.ROUTE)
    expect(calculateAchievementStage(6, 144)).toBe(AchievementStage.EXPEDITION)
    expect(calculateAchievementStage(6, 216)).toBe(AchievementStage.SUCCESS)
  })
})
