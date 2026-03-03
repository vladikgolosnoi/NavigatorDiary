import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AnnouncementDto } from './dto/announcement.dto'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listPublic() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async listAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  async createAnnouncement(userId: string, dto: AnnouncementDto) {
    const created = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        isActive: dto.isActive ?? true,
        publishedAt: dto.isActive === false ? null : new Date(),
        createdById: userId
      }
    })
    await this.auditService.log('ANNOUNCEMENT_CREATED', userId, 'Announcement', created.id)
    return created
  }

  async updateAnnouncement(userId: string, id: string, dto: AnnouncementDto) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException('Анонс не найден')
    }
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        isActive: dto.isActive ?? existing.isActive,
        publishedAt: dto.isActive === false ? null : existing.publishedAt ?? new Date()
      }
    })
    await this.auditService.log('ANNOUNCEMENT_UPDATED', userId, 'Announcement', id)
    return updated
  }

  async deleteAnnouncement(userId: string, id: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException('Анонс не найден')
    }
    await this.prisma.announcement.delete({ where: { id } })
    await this.auditService.log('ANNOUNCEMENT_DELETED', userId, 'Announcement', id)
    return { success: true }
  }
}
