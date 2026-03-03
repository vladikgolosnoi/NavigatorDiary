import {
  PrismaClient,
  RoleName,
  SpecialtyLevelName,
  SpecialtyResourceType,
  TeamStatus,
  UserStatus
} from '@prisma/client'
import { readFileSync } from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type GoalCatalogCompetency = {
  name: string
  goals: string[]
}

type GoalCatalogSphere = {
  name: string
  competencies: GoalCatalogCompetency[]
}

type GoalCatalogAgeGroup = {
  name: string
  minAge: number
  maxAge: number
  sortOrder: number
  spheres: GoalCatalogSphere[]
}

type SpecialtyCatalogLevels = {
  BRONZE?: string[]
  SILVER?: string[]
  GOLD?: string[]
}

type SpecialtyCatalogItem = {
  name: string
  levels?: SpecialtyCatalogLevels
}

function loadGoalCatalog(): GoalCatalogAgeGroup[] {
  const filePath = path.resolve(__dirname, 'seed-data', 'goal-catalog.json')
  const raw = readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as { ageGroups?: GoalCatalogAgeGroup[] }
  return parsed.ageGroups ?? []
}

function loadSpecialtiesCatalog(): SpecialtyCatalogItem[] {
  const filePath = path.resolve(__dirname, 'seed-data', 'specialties-catalog.json')
  const raw = readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as { specialties?: SpecialtyCatalogItem[] }
  return (parsed.specialties ?? []).filter((item) => item.name?.trim().length > 0)
}

const specialtyLevels: SpecialtyLevelName[] = [
  SpecialtyLevelName.BRONZE,
  SpecialtyLevelName.SILVER,
  SpecialtyLevelName.GOLD
]

const specialtyLevelDescriptions: Record<SpecialtyLevelName, string> = {
  [SpecialtyLevelName.BRONZE]: 'Базовый уровень.',
  [SpecialtyLevelName.SILVER]: 'Средний уровень.',
  [SpecialtyLevelName.GOLD]: 'Продвинутый уровень.'
}

function normalizeChecklistItems(items: string[] | undefined): string[] {
  if (!items) {
    return []
  }

  return items
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item.length > 0)
}

async function seedRoles() {
  const roles = [RoleName.ORGANIZER, RoleName.LEADER, RoleName.NAVIGATOR]
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role }
    })
  }
}

async function seedGoals() {
  const goalCatalog = loadGoalCatalog()
  if (goalCatalog.length === 0) {
    return
  }

  await prisma.goalReaction.deleteMany()
  await prisma.goalProgress.deleteMany()
  await prisma.userGoal.deleteMany()
  await prisma.goalSelection.deleteMany()
  await prisma.goalActivity.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.competency.deleteMany()
  await prisma.sphere.deleteMany()
  await prisma.ageGroup.deleteMany()

  const sphereMap = new Map<
    string,
    { id: string; competencyMap: Map<string, { id: string; sortOrder: number }> }
  >()
  let sphereSortOrder = 1

  for (const ageGroup of goalCatalog) {
    const ageGroupRecord = await prisma.ageGroup.create({
      data: {
        name: ageGroup.name,
        minAge: ageGroup.minAge,
        maxAge: ageGroup.maxAge,
        sortOrder: ageGroup.sortOrder
      }
    })

    for (const sphere of ageGroup.spheres) {
      let sphereEntry = sphereMap.get(sphere.name)
      if (!sphereEntry) {
        const createdSphere = await prisma.sphere.create({
          data: {
            name: sphere.name,
            sortOrder: sphereSortOrder
          }
        })
        sphereEntry = {
          id: createdSphere.id,
          competencyMap: new Map()
        }
        sphereMap.set(sphere.name, sphereEntry)
        sphereSortOrder += 1
      }

      for (const competency of sphere.competencies) {
        let competencyEntry = sphereEntry.competencyMap.get(competency.name)
        if (!competencyEntry) {
          const createdCompetency = await prisma.competency.create({
            data: {
              name: competency.name,
              sphereId: sphereEntry.id,
              sortOrder: sphereEntry.competencyMap.size + 1
            }
          })
          competencyEntry = {
            id: createdCompetency.id,
            sortOrder: sphereEntry.competencyMap.size + 1
          }
          sphereEntry.competencyMap.set(competency.name, competencyEntry)
        }

        for (const [goalIndex, goalName] of competency.goals.entries()) {
          await prisma.goal.create({
            data: {
              name: goalName,
              competencyId: competencyEntry.id,
              ageGroupId: ageGroupRecord.id,
              sortOrder: goalIndex + 1,
              activities: {
                create: [
                  {
                    title: 'Материалы по целям (Приложение №2)',
                    url: '/resources/goals-catalog.pdf'
                  }
                ]
              }
            }
          })
        }
      }
    }
  }
}

async function seedSpecialties() {
  const specialtiesCatalog = loadSpecialtiesCatalog()
  if (specialtiesCatalog.length === 0) {
    return
  }

  const areaName = 'Специальности по приложению №3'
  const areaDescription = 'Перечень и требования к специальностям из Приложения №3.'

  const existingArea = await prisma.area.findFirst({
    where: { name: areaName }
  })

  const area = existingArea
    ? await prisma.area.update({
        where: { id: existingArea.id },
        data: {
          description: areaDescription,
          sortOrder: 1
        }
      })
    : await prisma.area.create({
        data: {
          name: areaName,
          description: areaDescription,
          sortOrder: 1
        }
      })

  for (const [specialtyIndex, specialty] of specialtiesCatalog.entries()) {
    const specialtyName = specialty.name.trim()
    if (!specialtyName) {
      continue
    }

    const existingSpecialty = await prisma.specialty.findFirst({
      where: {
        areaId: area.id,
        name: specialtyName
      }
    })

    const specialtyRecord = existingSpecialty
      ? await prisma.specialty.update({
          where: { id: existingSpecialty.id },
          data: {
            sortOrder: specialtyIndex + 1
          }
        })
      : await prisma.specialty.create({
          data: {
            areaId: area.id,
            name: specialtyName,
            sortOrder: specialtyIndex + 1
          }
        })

    const resourceSeeds: Array<{ type: SpecialtyResourceType; title: string; url: string }> = [
      {
        type: SpecialtyResourceType.VIDEO,
        title: `Видео-подборка по специальности «${specialtyName}»`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`специальность ${specialtyName} обучение`)}`
      },
      {
        type: SpecialtyResourceType.MATERIAL,
        title: `Материалы по специальности «${specialtyName}» (Приложение №3)`,
        url: '/resources/specialties-catalog.docx'
      }
    ]

    for (const resourceSeed of resourceSeeds) {
      const existingResource = await prisma.specialtyResource.findFirst({
        where: {
          specialtyId: specialtyRecord.id,
          type: resourceSeed.type
        }
      })

      if (existingResource) {
        await prisma.specialtyResource.update({
          where: { id: existingResource.id },
          data: {
            title: resourceSeed.title,
            url: resourceSeed.url
          }
        })
      } else {
        await prisma.specialtyResource.create({
          data: {
            specialtyId: specialtyRecord.id,
            type: resourceSeed.type,
            title: resourceSeed.title,
            url: resourceSeed.url
          }
        })
      }
    }

    for (const [levelIndex, level] of specialtyLevels.entries()) {
      const existingLevel = await prisma.specialtyLevel.findFirst({
        where: {
          specialtyId: specialtyRecord.id,
          name: level
        }
      })

      const levelRecord = existingLevel
        ? await prisma.specialtyLevel.update({
            where: { id: existingLevel.id },
            data: {
              description: specialtyLevelDescriptions[level],
              sortOrder: levelIndex + 1
            }
          })
        : await prisma.specialtyLevel.create({
            data: {
              specialtyId: specialtyRecord.id,
              name: level,
              description: specialtyLevelDescriptions[level],
              sortOrder: levelIndex + 1
            }
          })

      const checklistItems = normalizeChecklistItems(specialty.levels?.[level])
      for (const [itemIndex, item] of checklistItems.entries()) {
        const existingChecklistItem = await prisma.specialtyChecklistItem.findFirst({
          where: {
            levelId: levelRecord.id,
            title: item
          }
        })

        if (existingChecklistItem) {
          await prisma.specialtyChecklistItem.update({
            where: { id: existingChecklistItem.id },
            data: {
              sortOrder: itemIndex + 1
            }
          })
        } else {
          await prisma.specialtyChecklistItem.create({
            data: {
              levelId: levelRecord.id,
              title: item,
              sortOrder: itemIndex + 1
            }
          })
        }
      }
    }
  }
}

async function seedDemoAccess() {
  const organizerRole = await prisma.role.findUnique({
    where: { name: RoleName.ORGANIZER }
  })
  const leaderRole = await prisma.role.findUnique({
    where: { name: RoleName.LEADER }
  })
  const navigatorRole = await prisma.role.findUnique({
    where: { name: RoleName.NAVIGATOR }
  })

  if (!organizerRole || !leaderRole || !navigatorRole) {
    return
  }

  const demoTeamName = 'Команда Демонстрация'
  const demoTeamCity = 'Ростов-на-Дону'
  const demoTeamInstitution = 'Навигаторский центр'

  const existingTeam = await prisma.team.findFirst({
    where: { name: demoTeamName }
  })

  const demoTeam = existingTeam
    ? await prisma.team.update({
        where: { id: existingTeam.id },
        data: {
          city: demoTeamCity,
          institution: demoTeamInstitution,
          status: TeamStatus.ACTIVE
        }
      })
    : await prisma.team.create({
        data: {
          name: demoTeamName,
          city: demoTeamCity,
          institution: demoTeamInstitution,
          status: TeamStatus.ACTIVE
        }
      })

  const demoPasswordHash = await bcrypt.hash('Demo123!', 10)

  await prisma.user.upsert({
    where: { email: 'organizer@demo.local' },
    update: {
      firstName: 'Ольга',
      lastName: 'Организатор',
      middleName: '',
      birthDate: new Date('1990-01-01'),
      passwordHash: demoPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: organizerRole.id,
      teamId: null
    },
    create: {
      firstName: 'Ольга',
      lastName: 'Организатор',
      middleName: '',
      birthDate: new Date('1990-01-01'),
      email: 'organizer@demo.local',
      passwordHash: demoPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: organizerRole.id
    }
  })

  await prisma.user.upsert({
    where: { email: 'leader@demo.local' },
    update: {
      firstName: 'Роман',
      lastName: 'Руководитель',
      middleName: '',
      birthDate: new Date('1989-01-01'),
      passwordHash: demoPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: leaderRole.id,
      teamId: demoTeam.id
    },
    create: {
      firstName: 'Роман',
      lastName: 'Руководитель',
      middleName: '',
      birthDate: new Date('1989-01-01'),
      email: 'leader@demo.local',
      passwordHash: demoPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: leaderRole.id,
      teamId: demoTeam.id
    }
  })

  await prisma.user.upsert({
    where: { email: 'navigator@demo.local' },
    update: {
      firstName: 'Нина',
      lastName: 'Навигатор',
      middleName: '',
      birthDate: new Date('2012-01-01'),
      passwordHash: demoPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: navigatorRole.id,
      teamId: demoTeam.id
    },
    create: {
      firstName: 'Нина',
      lastName: 'Навигатор',
      middleName: '',
      birthDate: new Date('2012-01-01'),
      email: 'navigator@demo.local',
      passwordHash: demoPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: navigatorRole.id,
      teamId: demoTeam.id
    }
  })
}

async function main() {
  await seedRoles()
  await seedGoals()
  await seedSpecialties()
  await seedDemoAccess()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
