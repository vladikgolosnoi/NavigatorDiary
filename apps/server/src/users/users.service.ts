import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import * as bcrypt from 'bcryptjs'
import { AuditService } from '../audit/audit.service'
import { RoleName, UserStatus } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, team: true }
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      birthDate: user.birthDate,
      email: user.email,
      role: user.role.name,
      team: user.team
        ? {
            id: user.team.id,
            name: user.team.name,
            city: user.team.city,
            institution: user.team.institution,
            status: user.team.status
          }
        : null
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!currentUser) {
      throw new NotFoundException('Пользователь не найден')
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email }
      })

      if (existing && existing.id !== userId) {
        throw new ConflictException('Email уже используется другим пользователем')
      }
    }

    if (currentUser.role.name === RoleName.NAVIGATOR) {
      const nextFirstName = dto.firstName?.trim() ?? currentUser.firstName
      const nextLastName = dto.lastName?.trim() ?? currentUser.lastName
      const nextMiddleName = dto.middleName === undefined ? currentUser.middleName : dto.middleName?.trim() || null
      const nextBirthDate = dto.birthDate ?? currentUser.birthDate.toISOString().slice(0, 10)

      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          role: { name: RoleName.NAVIGATOR },
          firstName: { equals: this.normalizeName(nextFirstName), mode: 'insensitive' },
          lastName: { equals: this.normalizeName(nextLastName), mode: 'insensitive' },
          birthDate: {
            gte: this.getBirthDateBounds(nextBirthDate).start,
            lt: this.getBirthDateBounds(nextBirthDate).end
          },
          ...(this.normalizeMiddleName(nextMiddleName)
            ? {
                middleName: { equals: this.normalizeMiddleName(nextMiddleName), mode: 'insensitive' }
              }
            : {
                middleName: null
              })
        },
        select: { id: true }
      })

      if (duplicateUser) {
        throw new ConflictException('Пользователь с такими ФИО и датой рождения уже существует. Используйте восстановление доступа.')
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        email: dto.email
      }
    })
    await this.auditService.log('PROFILE_UPDATED', userId, 'User', userId)

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      birthDate: user.birthDate,
      email: user.email
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash)

    if (!passwordValid) {
      throw new BadRequestException('Текущий пароль неверен')
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего')
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10)

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    })
    await this.auditService.log('PASSWORD_CHANGED', userId, 'User', userId)

    return { success: true }
  }

  async resetPassword(
    actorId: string,
    actorRole: RoleName,
    actorTeamId: string | null,
    targetUserId: string,
    dto: ResetPasswordDto
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true }
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    if (actorRole === RoleName.LEADER) {
      if (!actorTeamId || user.teamId !== actorTeamId) {
        throw new ForbiddenException('Нельзя сбросить пароль пользователю из другой команды')
      }
      if (user.role.name === RoleName.ORGANIZER || user.role.name === RoleName.LEADER) {
        throw new ForbiddenException('Руководитель может сбрасывать пароль только участникам своей команды')
      }
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10)

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: newHash }
    })

    await this.auditService.log('PASSWORD_RESET', actorId, 'User', targetUserId, {
      targetRole: user.role.name
    })

    return { success: true }
  }

  async searchUsers(query: string) {
    const normalizedQuery = query.trim()

    if (normalizedQuery.length < 2) {
      throw new BadRequestException('Введите минимум 2 символа для поиска')
    }

    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: normalizedQuery, mode: 'insensitive' } },
          { firstName: { contains: normalizedQuery, mode: 'insensitive' } },
          { lastName: { contains: normalizedQuery, mode: 'insensitive' } },
          { middleName: { contains: normalizedQuery, mode: 'insensitive' } }
        ]
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        status: true,
        role: {
          select: {
            name: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  async listPendingUsers(teamId?: string | null) {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.PENDING,
        teamId: teamId ?? undefined
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthDate: true,
        email: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            city: true,
            institution: true
          }
        }
      }
    })
  }
}
