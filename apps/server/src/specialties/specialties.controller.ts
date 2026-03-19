import { Body, Controller, Get, Param, Post, Req, Query } from '@nestjs/common'
import { SpecialtiesService } from './specialties.service'
import { SelectSpecialtyDto } from './dto/select-specialty.dto'
import { ChecklistItemDto } from './dto/checklist-item.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { Request } from 'express'
import { AuthUser } from '../goals/goals.types'

interface RequestWithUser extends Request {
  user: AuthUser
}

@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get('my')
  @Roles(RoleName.NAVIGATOR)
  async getMySpecialty(@Req() req: RequestWithUser) {
    return this.specialtiesService.getMySpecialty(req.user.userId)
  }

  @Post('select')
  @Roles(RoleName.NAVIGATOR)
  async selectSpecialty(@Req() req: RequestWithUser, @Body() dto: SelectSpecialtyDto) {
    return this.specialtiesService.selectSpecialty(req.user.userId, dto)
  }

  @Post(':userSpecialtyId/checklist')
  @Roles(RoleName.NAVIGATOR)
  async checkChecklist(
    @Req() req: RequestWithUser,
    @Param('userSpecialtyId') userSpecialtyId: string,
    @Body() dto: ChecklistItemDto
  ) {
    return this.specialtiesService.checkChecklistItem(req.user, userSpecialtyId, dto)
  }

  @Post(':userSpecialtyId/cancel')
  @Roles(RoleName.NAVIGATOR)
  async cancelSpecialty(@Req() req: RequestWithUser, @Param('userSpecialtyId') userSpecialtyId: string) {
    return this.specialtiesService.cancelSpecialty(req.user, userSpecialtyId)
  }

  @Post(':userSpecialtyId/confirm')
  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  async confirmSpecialty(@Req() req: RequestWithUser, @Param('userSpecialtyId') userSpecialtyId: string) {
    return this.specialtiesService.confirmSpecialty(req.user, userSpecialtyId)
  }

  @Get('pending')
  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  async listPending(@Req() req: RequestWithUser, @Query('teamId') teamId?: string) {
    return this.specialtiesService.listPendingConfirmations(req.user, teamId ?? null)
  }
}
