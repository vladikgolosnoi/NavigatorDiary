import { Injectable } from '@nestjs/common'
import { TeamStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    return this.prisma.team.findMany({
      where: { status: TeamStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        city: true,
        institution: true
      }
    })
  }

  async listPending() {
    return this.prisma.team.findMany({
      where: { status: TeamStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        institution: true,
        createdAt: true
      }
    })
  }
}
