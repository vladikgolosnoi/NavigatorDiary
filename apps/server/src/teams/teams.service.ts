import { Injectable, NotFoundException } from '@nestjs/common'
import { TeamStatus, UserStatus } from '@prisma/client'
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

  async listActiveMembers(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: {
          where: { status: UserStatus.ACTIVE },
          include: { role: true },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
        }
      }
    })

    if (!team) {
      throw new NotFoundException('Команда не найдена')
    }

    return team.users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name
    }))
  }
}
