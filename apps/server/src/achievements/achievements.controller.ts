import { Controller, Get, Req } from '@nestjs/common'
import { AchievementsService } from './achievements.service'
import { Request } from 'express'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'

interface RequestWithUser extends Request {
  user: {
    userId: string
  }
}

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('my')
  @Roles(RoleName.NAVIGATOR)
  async getMyAchievements(@Req() req: RequestWithUser) {
    return this.achievementsService.getMyAchievements(req.user.userId)
  }
}
