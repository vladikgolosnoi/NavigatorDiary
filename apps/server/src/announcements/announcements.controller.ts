import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'
import { AnnouncementDto } from './dto/announcement.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { Public } from '../auth/decorators/public.decorator'
import { Request } from 'express'
import { Req } from '@nestjs/common'

interface RequestWithUser extends Request {
  user: {
    userId: string
  }
}

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('public')
  @Public()
  async listPublic() {
    return this.announcementsService.listPublic()
  }

  @Get()
  @Roles(RoleName.ORGANIZER)
  async listAll() {
    return this.announcementsService.listAll()
  }

  @Post()
  @Roles(RoleName.ORGANIZER)
  async create(@Req() req: RequestWithUser, @Body() dto: AnnouncementDto) {
    return this.announcementsService.createAnnouncement(req.user.userId, dto)
  }

  @Patch(':id')
  @Roles(RoleName.ORGANIZER)
  async update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: AnnouncementDto) {
    return this.announcementsService.updateAnnouncement(req.user.userId, id, dto)
  }

  @Delete(':id')
  @Roles(RoleName.ORGANIZER)
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.announcementsService.deleteAnnouncement(req.user.userId, id)
  }
}
