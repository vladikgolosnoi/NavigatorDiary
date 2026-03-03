import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationDto } from './dto/notification.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { Request } from 'express'

interface RequestWithUser extends Request {
  user: {
    userId: string
    teamId?: string | null
    role?: RoleName
  }
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  async listMy(@Req() req: RequestWithUser) {
    return this.notificationsService.listMyNotifications(req.user.userId, req.user.teamId, req.user.role)
  }

  @Post(':id/read')
  async markAsRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.userId, id)
  }

  @Post()
  @Roles(RoleName.ORGANIZER)
  async create(@Req() req: RequestWithUser, @Body() dto: NotificationDto) {
    return this.notificationsService.createNotification(req.user.userId, dto)
  }
}
