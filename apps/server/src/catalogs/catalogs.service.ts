import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAgeGroups() {
    return this.prisma.ageGroup.findMany({
      orderBy: { sortOrder: 'asc' }
    })
  }

  async listSpheres(ageGroupId?: string) {
    return this.prisma.sphere.findMany({
      where: ageGroupId
        ? {
            competencies: {
              some: {
                goals: {
                  some: { ageGroupId }
                }
              }
            }
          }
        : undefined,
      orderBy: { sortOrder: 'asc' }
    })
  }

  async listCompetencies(sphereId?: string, ageGroupId?: string) {
    return this.prisma.competency.findMany({
      where: {
        ...(sphereId ? { sphereId } : {}),
        ...(ageGroupId
          ? {
              goals: {
                some: { ageGroupId }
              }
            }
          : {})
      },
      orderBy: { sortOrder: 'asc' }
    })
  }

  async listGoals(competencyId?: string, ageGroupId?: string) {
    return this.prisma.goal.findMany({
      where: {
        ...(competencyId ? { competencyId } : {}),
        ...(ageGroupId ? { ageGroupId } : {})
      },
      orderBy: { sortOrder: 'asc' },
      include: { activities: true }
    })
  }

  async listAreas() {
    return this.prisma.area.findMany({
      orderBy: { sortOrder: 'asc' }
    })
  }

  async listSpecialties(areaId?: string) {
    return this.prisma.specialty.findMany({
      where: areaId ? { areaId } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
        resources: true,
        levels: {
          orderBy: { sortOrder: 'asc' },
          include: {
            checklist: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    })
  }
}
