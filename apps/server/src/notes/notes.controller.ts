import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { NotesService } from './notes.service'
import { NoteDto } from './dto/note.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { Request } from 'express'

interface RequestWithUser extends Request {
  user: {
    userId: string
  }
}

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async list(@Req() req: RequestWithUser) {
    return this.notesService.listNotes(req.user.userId)
  }

  @Post()
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async create(@Req() req: RequestWithUser, @Body() dto: NoteDto) {
    return this.notesService.createNote(req.user.userId, dto)
  }

  @Patch(':id')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: NoteDto) {
    return this.notesService.updateNote(req.user.userId, id, dto)
  }

  @Delete(':id')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.notesService.deleteNote(req.user.userId, id)
  }
}
