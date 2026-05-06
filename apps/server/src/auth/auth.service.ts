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
import * as nodemailer from 'nodemailer'

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

  private parseFullName(fullName?: string | null) {
    const normalized = fullName?.trim().replace(/\s+/g, ' ')
    if (!normalized) {
      return null
    }

    const [lastName, firstName, ...middleNameParts] = normalized.split(' ')
    if (!lastName || !firstName) {
      return null
    }

    return {
      lastName: this.normalizeName(lastName),
      firstName: this.normalizeName(firstName),
      middleName: this.normalizeMiddleName(middleNameParts.join(' '))
    }
  }

  private async findPasswordResetUserByName(fullName?: string | null, teamName?: string | null) {
    const parsed = this.parseFullName(fullName)
    if (!parsed) {
      return null
    }

    const normalizedTeamName = teamName?.trim().replace(/\s+/g, ' ')
    const middleNameVariants = parsed.middleName ? [parsed.middleName, null] : [null]
    const teamNameVariants = normalizedTeamName ? [normalizedTeamName, null] : [null]

    for (const teamNameVariant of teamNameVariants) {
      for (const middleNameVariant of middleNameVariants) {
        const candidates = await this.prisma.user.findMany({
          where: {
            firstName: { equals: parsed.firstName, mode: 'insensitive' },
            lastName: { equals: parsed.lastName, mode: 'insensitive' },
            ...(middleNameVariant
              ? {
                  middleName: { equals: middleNameVariant, mode: 'insensitive' }
                }
              : {}),
            ...(teamNameVariant
              ? {
                  team: {
                    name: { equals: teamNameVariant, mode: 'insensitive' }
                  }
                }
              : {}),
            status: {
              not: UserStatus.REJECTED
            }
          },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
        })

        if (candidates.length === 1) {
          return candidates[0]
        }
      }
    }

    return null
  }

  private async resolvePasswordResetUser(login: string, request: { loginHint?: string | null; contact: string; fullName?: string | null; teamName?: string | null }) {
    const normalizedLogin = login.trim().toLowerCase()

    const directUser = await this.prisma.user.findUnique({
      where: { email: normalizedLogin }
    })

    if (directUser) {
      return directUser
    }

    const fallbackEmails = Array.from(
      new Set([request.loginHint, request.contact].filter((value): value is string => this.isValidEmail(value)).map((value) => value.trim().toLowerCase()))
    )

    for (const fallbackEmail of fallbackEmails) {
      const fallbackUser = await this.prisma.user.findUnique({
        where: { email: fallbackEmail }
      })

      if (fallbackUser) {
        return fallbackUser
      }
    }

    return this.findPasswordResetUserByName(request.fullName, request.teamName)
  }

  private isValidEmail(value?: string | null) {
    if (!value) {
      return false
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim())
  }

  private getPasswordResetEmailRecipient(contact: string, userEmail?: string | null) {
    if (this.isValidEmail(contact)) {
      return contact.trim().toLowerCase()
    }

    if (this.isValidEmail(userEmail) && !userEmail?.endsWith('@demo.local')) {
      return userEmail!.trim().toLowerCase()
    }

    return null
  }

  private async sendPasswordResetEmail(recipient: string, login: string, password: string, fullName?: string | null) {
    const host = process.env.SMTP_HOST?.trim()
    const portRaw = process.env.SMTP_PORT?.trim()
    const user = process.env.SMTP_USER?.trim()
    const pass = process.env.SMTP_PASS?.trim()
    const from = process.env.SMTP_FROM?.trim()

    if (!host || !portRaw || !user || !pass || !from) {
      throw new Error('SMTP не настроен')
    }

    const port = Number(portRaw)
    const secure = process.env.SMTP_SECURE?.trim() === 'true' || port === 465

    if (!Number.isFinite(port)) {
      throw new Error('SMTP_PORT задан некорректно')
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    })

    const addressee = fullName?.trim() || 'пользователь'

    await transporter.sendMail({
      from,
      to: recipient,
      subject: 'Восстановление доступа — Дневник Навигатора',
      text: [
        `Здравствуйте, ${addressee}.`,
        '',
        'Организатор выдал вам новый временный пароль для входа в сервис "Дневник Навигатора".',
        '',
        `Логин: ${login}`,
        `Временный пароль: ${password}`,
        '',
        'После входа рекомендуем сразу сменить пароль в профиле.',
        '',
        'Ссылка для входа: https://navigator-diary.ru'
      ].join('\n')
    })
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
    const user = await this.resolvePasswordResetUser(normalizedLogin, request)

    if (!user) {
      throw new NotFoundException('Пользователь с таким логином не найден')
    }

    if (!user.email?.trim()) {
      throw new BadRequestException('У найденного пользователя не указан логин для входа')
    }

    const resolvedLogin = user.email.trim().toLowerCase()

    const passwordHash = await bcrypt.hash(dto.newPassword, 10)
    const emailRecipient = this.getPasswordResetEmailRecipient(request.contact, user.email)

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
          resolvedLogin,
          issuedPassword: dto.newPassword,
          emailRecipient,
          emailSentAt: null,
          emailError: emailRecipient ? null : 'У пользователя нет подтвержденной почты для автоматической отправки'
        }
      })
    ])

    let emailSent = false
    let emailError: string | null = null

    if (emailRecipient) {
      try {
        await this.sendPasswordResetEmail(emailRecipient, resolvedLogin, dto.newPassword, request.fullName)
        emailSent = true
      } catch (error) {
        emailError = error instanceof Error ? error.message : 'Не удалось отправить письмо'
      }
    }

    await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        emailSentAt: emailSent ? new Date() : null,
        emailError
      }
    })

    await this.auditService.log('PASSWORD_RESET_REQUEST_COMPLETED', organizerId, 'PasswordResetRequest', requestId, {
      resolvedLogin,
      targetUserId: user.id,
      emailRecipient,
      emailSent,
      emailError
    })

    return { success: true, emailSent, emailRecipient, emailError }
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
        resolvedById: organizerId,
        issuedPassword: null,
        emailRecipient: null,
        emailSentAt: null,
        emailError: null
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
