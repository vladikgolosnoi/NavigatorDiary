import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { RoleName, TeamStatus, UserStatus } from '@prisma/client'
import { RegisterTeamDto } from './dto/register-team.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcryptjs'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  async registerTeam(dto: RegisterTeamDto) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        city: dto.city?.trim() || 'Не указан',
        institution: dto.institution,
        status: TeamStatus.PENDING
      }
    })

    return team
  }

  async registerUser(dto: RegisterUserDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId }
    })

    if (!team) {
      throw new NotFoundException('Команда не найдена')
    }

    if (team.status !== TeamStatus.ACTIVE) {
      throw new BadRequestException('Команда еще не подтверждена')
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    })

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует')
    }

    const role = await this.prisma.role.findUnique({
      where: { name: RoleName.NAVIGATOR }
    })

    if (!role) {
      throw new BadRequestException('Роль NAVIGATOR не найдена')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        birthDate: new Date(dto.birthDate),
        email: dto.email,
        passwordHash,
        status: UserStatus.PENDING,
        roleId: role.id,
        teamId: team.id
      }
    })

    return user
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true }
    })

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Пользователь не подтвержден')
    }

    const payload = {
      sub: user.id,
      role: user.role.name,
      teamId: user.teamId
    }

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        role: user.role.name,
        teamId: user.teamId
      }
    }
  }

  async approveTeam(teamId: string, approverId: string) {
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      include: { role: true }
    })

    if (!approver || approver.role.name !== RoleName.ORGANIZER) {
      throw new ForbiddenException('Недостаточно прав для подтверждения команды')
    }

    const team = await this.prisma.team.findUnique({ where: { id: teamId } })

    if (!team) {
      throw new NotFoundException('Команда не найдена')
    }

    if (team.status === TeamStatus.ACTIVE) {
      return team
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        status: TeamStatus.ACTIVE,
        approvedAt: new Date(),
        approvedById: approverId
      }
    })
    await this.auditService.log('TEAM_APPROVED', approverId, 'Team', teamId, { status: 'ACTIVE' })
    return updated
  }

  async approveUser(userId: string, approverId: string) {
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      include: { role: true }
    })

    if (!approver || (approver.role.name !== RoleName.LEADER && approver.role.name !== RoleName.ORGANIZER)) {
      throw new ForbiddenException('Недостаточно прав для подтверждения пользователя')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    if (approver.role.name === RoleName.LEADER && user.teamId !== approver.teamId) {
      throw new ForbiddenException('Нельзя подтверждать пользователя из другой команды')
    }

    if (user.status === UserStatus.ACTIVE) {
      return user
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        approvedById: approverId
      }
    })
    await this.auditService.log('USER_APPROVED', approverId, 'User', userId, { status: 'ACTIVE' })
    return updated
  }

  async rejectTeam(teamId: string, approverId: string) {
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      include: { role: true }
    })

    if (!approver || approver.role.name !== RoleName.ORGANIZER) {
      throw new ForbiddenException('Недостаточно прав для отклонения команды')
    }

    const team = await this.prisma.team.findUnique({ where: { id: teamId } })

    if (!team) {
      throw new NotFoundException('Команда не найдена')
    }

    if (team.status === TeamStatus.REJECTED) {
      return team
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        status: TeamStatus.REJECTED,
        approvedAt: new Date(),
        approvedById: approverId
      }
    })
    await this.auditService.log('TEAM_REJECTED', approverId, 'Team', teamId, { status: 'REJECTED' })
    return updated
  }

  async rejectUser(userId: string, approverId: string) {
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      include: { role: true }
    })

    if (!approver || (approver.role.name !== RoleName.LEADER && approver.role.name !== RoleName.ORGANIZER)) {
      throw new ForbiddenException('Недостаточно прав для отклонения пользователя')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    if (approver.role.name === RoleName.LEADER && user.teamId !== approver.teamId) {
      throw new ForbiddenException('Нельзя отклонять пользователя из другой команды')
    }

    if (user.status === UserStatus.REJECTED) {
      return user
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.REJECTED,
        approvedById: approverId
      }
    })
    await this.auditService.log('USER_REJECTED', approverId, 'User', userId, { status: 'REJECTED' })
    return updated
  }
}
