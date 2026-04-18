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
import { PasswordResetRequestStatus, RoleName, TeamStatus, UserStatus } from '@prisma/client'
import { RegisterTeamDto } from './dto/register-team.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { LoginDto } from './dto/login.dto'
import { CreatePasswordResetRequestDto } from './dto/create-password-reset-request.dto'
import { ResolvePasswordResetRequestDto } from './dto/resolve-password-reset-request.dto'
import * as bcrypt from 'bcryptjs'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  private normalizeName(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
  }

  private getBirthDateBounds(birthDate: string) {
    const parsed = new Date(birthDate)

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Неверная дата рождения')
    }

    const start = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)

    return { start, end }
  }

  private normalizeMiddleName(value?: string | null) {
    const normalized = value?.trim().replace(/\s+/g, ' ')
    return normalized ? normalized.toLowerCase() : null
  }

  private async findDuplicateNavigator(dto: RegisterUserDto) {
    const firstName = this.normalizeName(dto.firstName)
    const lastName = this.normalizeName(dto.lastName)
    const middleName = this.normalizeMiddleName(dto.middleName)
    const { start, end } = this.getBirthDateBounds(dto.birthDate)

    return this.prisma.user.findFirst({
      where: {
        role: { name: RoleName.NAVIGATOR },
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
        birthDate: { gte: start, lt: end },
        ...(middleName
          ? {
              middleName: { equals: middleName, mode: 'insensitive' }
            }
          : {
              middleName: null
            })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthDate: true,
        email: true,
        status: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

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

    const duplicateUser = await this.findDuplicateNavigator(dto)

    if (duplicateUser) {
      throw new ConflictException('Пользователь с такими ФИО и датой рождения уже зарегистрирован. Используйте восстановление доступа.')
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

  async createPasswordResetRequest(dto: CreatePasswordResetRequestDto) {
    const request = await this.prisma.passwordResetRequest.create({
      data: {
        loginHint: dto.loginHint?.trim() || null,
        fullName: dto.fullName?.trim() || null,
        teamName: dto.teamName?.trim() || null,
        contact: dto.contact.trim(),
        note: dto.note?.trim() || null
      }
    })

    await this.auditService.log('PASSWORD_RESET_REQUEST_CREATED', null, 'PasswordResetRequest', request.id, {
      loginHint: request.loginHint,
      teamName: request.teamName
    })

    return request
  }

  async listPasswordResetRequests() {
    return this.prisma.passwordResetRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        resolvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })
  }

  async completePasswordResetRequest(requestId: string, organizerId: string, dto: ResolvePasswordResetRequestDto) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new NotFoundException('Заявка на восстановление не найдена')
    }

    if (request.status !== PasswordResetRequestStatus.OPEN) {
      throw new BadRequestException('Заявка уже обработана')
    }

    const normalizedLogin = dto.login.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedLogin }
    })

    if (!user) {
      throw new NotFoundException('Пользователь с таким логином не найден')
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10)

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: PasswordResetRequestStatus.COMPLETED,
          resolvedAt: new Date(),
          resolvedById: organizerId,
          resolvedLogin: normalizedLogin
        }
      })
    ])

    await this.auditService.log('PASSWORD_RESET_REQUEST_COMPLETED', organizerId, 'PasswordResetRequest', requestId, {
      resolvedLogin: normalizedLogin,
      targetUserId: user.id
    })

    return { success: true }
  }

  async cancelPasswordResetRequest(requestId: string, organizerId: string) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new NotFoundException('Заявка на восстановление не найдена')
    }

    if (request.status !== PasswordResetRequestStatus.OPEN) {
      throw new BadRequestException('Заявка уже обработана')
    }

    const updated = await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: PasswordResetRequestStatus.CANCELLED,
        resolvedAt: new Date(),
        resolvedById: organizerId
      }
    })

    await this.auditService.log('PASSWORD_RESET_REQUEST_CANCELLED', organizerId, 'PasswordResetRequest', requestId)

    return updated
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

    await this.prisma.user.updateMany({
      where: {
        teamId,
        role: { name: RoleName.LEADER }
      },
      data: {
        teamId: null
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
