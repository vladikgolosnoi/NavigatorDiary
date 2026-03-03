import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import * as bcrypt from 'bcryptjs'
import { AuditService } from '../audit/audit.service'
import { UserStatus } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

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
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email }
      })

      if (existing && existing.id !== userId) {
        throw new ConflictException('Email уже используется другим пользователем')
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
