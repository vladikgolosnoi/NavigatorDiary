import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { AppealsService } from './appeals.service'
import { CreateAppealDto } from './dto/create-appeal.dto'
import { ReplyAppealDto } from './dto/reply-appeal.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { Request } from 'express'
import { AuthUser } from '../goals/goals.types'

interface RequestWithUser extends Request {
  user: AuthUser
}

@Controller('appeals')
export class AppealsController {
  constructor(private readonly appealsService: AppealsService) {}

  @Get('my')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async listMy(@Req() req: RequestWithUser) {
    return this.appealsService.listMyAppeals(req.user.userId)
  }

  @Get()
  @Roles(RoleName.ORGANIZER)
  async listAll() {
    return this.appealsService.listAllAppeals()
  }

  @Post()
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async create(@Req() req: RequestWithUser, @Body() dto: CreateAppealDto) {
    return this.appealsService.createAppeal(req.user, dto)
  }

  @Post(':id/reply')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async reply(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: ReplyAppealDto) {
    return this.appealsService.replyToAppeal(req.user, id, dto)
  }

  @Post(':id/close')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER, RoleName.ORGANIZER)
  async close(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.appealsService.closeAppeal(req.user, id)
  }
}
