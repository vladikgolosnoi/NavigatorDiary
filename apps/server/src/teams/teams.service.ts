import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { RoleName, TeamStatus, UserStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { RegisterTeamDto } from '../auth/dto/register-team.dto'
import { AssignTeamUserDto } from './dto/assign-team-user.dto'

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

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

  async createForLeader(leaderId: string, dto: RegisterTeamDto) {
    const leader = await this.prisma.user.findUnique({
      where: { id: leaderId },
      include: { role: true, team: true }
    })

    if (!leader || leader.role.name !== RoleName.LEADER) {
      throw new ForbiddenException('Только руководитель может создать команду из своей панели')
    }

    if (leader.teamId && leader.team && leader.team.status !== TeamStatus.REJECTED) {
      throw new BadRequestException('У руководителя уже есть привязанная команда')
    }

    const team = await this.prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name: dto.name,
          city: dto.city?.trim() || 'Не указан',
          institution: dto.institution,
          status: TeamStatus.PENDING
        }
      })

      await tx.user.update({
        where: { id: leaderId },
        data: {
          teamId: createdTeam.id
        }
      })

      return createdTeam
    })

    await this.auditService.log('TEAM_CREATED_BY_LEADER', leaderId, 'Team', team.id, {
      status: team.status,
      leaderId
    })

    return team
  }

  async assignUserToTeam(teamId: string, dto: AssignTeamUserDto, organizerId: string) {
    if (!dto.userId && !dto.email) {
      throw new BadRequestException('Укажите userId или email')
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      throw new NotFoundException('Команда не найдена')
    }

    const user = await this.prisma.user.findFirst({
      where: dto.userId ? { id: dto.userId } : { email: dto.email?.trim().toLowerCase() },
      include: { role: true }
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    if (user.role.name === RoleName.ORGANIZER) {
      throw new BadRequestException('Организатора нельзя привязать к команде')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { teamId: team.id }
    })

    await this.auditService.log('TEAM_USER_ASSIGNED', organizerId, 'User', user.id, {
      teamId: team.id,
      role: user.role.name
    })

    return {
      id: updatedUser.id,
      teamId: updatedUser.teamId,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: user.role.name
    }
  }
}
