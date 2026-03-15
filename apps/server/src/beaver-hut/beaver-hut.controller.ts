import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { BeaverHutService } from './beaver-hut.service'
import { Request } from 'express'
import { AwardBranchesDto } from './dto/award-branches.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { AdjustResourceDto } from './dto/adjust-resource.dto'

interface RequestWithUser extends Request {
  user: {
    userId: string
  }
}

@Controller('beaver-hut')
export class BeaverHutController {
  constructor(private readonly beaverHutService: BeaverHutService) {}

  @Get('my')
  async getMy(@Req() req: RequestWithUser) {
    return this.beaverHutService.getMyHut(req.user.userId)
  }

  @Post('branches/award')
  @Roles(RoleName.ORGANIZER)
  async awardBranches(@Req() req: RequestWithUser, @Body() dto: AwardBranchesDto) {
    return this.beaverHutService.awardBranches(req.user.userId, dto)
  }

  @Post('adjust')
  @Roles(RoleName.ORGANIZER)
  async adjustResource(@Req() req: RequestWithUser, @Body() dto: AdjustResourceDto) {
    return this.beaverHutService.adjustResource(req.user.userId, dto)
  }
}
