import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NoteDto } from './dto/note.dto'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listNotes(userId: string) {
    return this.prisma.anonymousNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async createNote(userId: string, dto: NoteDto) {
    const created = await this.prisma.anonymousNote.create({
      data: {
        userId,
        content: dto.content
      }
    })
    await this.auditService.log('NOTE_CREATED', userId, 'AnonymousNote', created.id)
    return created
  }

  async updateNote(userId: string, noteId: string, dto: NoteDto) {
    const note = await this.prisma.anonymousNote.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      throw new NotFoundException('Заметка не найдена')
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Нет доступа к заметке')
    }

    const updated = await this.prisma.anonymousNote.update({
      where: { id: noteId },
      data: { content: dto.content }
    })
    await this.auditService.log('NOTE_UPDATED', userId, 'AnonymousNote', noteId)
    return updated
  }

  async deleteNote(userId: string, noteId: string) {
    const note = await this.prisma.anonymousNote.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      throw new NotFoundException('Заметка не найдена')
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Нет доступа к заметке')
    }

    await this.prisma.anonymousNote.delete({
      where: { id: noteId }
    })
    await this.auditService.log('NOTE_DELETED', userId, 'AnonymousNote', noteId)

    return { success: true }
  }
}
