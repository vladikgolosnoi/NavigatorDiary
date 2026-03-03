import { Body, Controller, Get, Param, Patch, Post, Req, Query } from '@nestjs/common'
import { GoalsService } from './goals.service'
import { SelectGoalsDto } from './dto/select-goals.dto'
import { Request } from 'express'
import { RoleName } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { GoalProgressDto } from './dto/goal-progress.dto'
import { AuthUser } from './goals.types'
import { UpdateGoalCommentDto } from './dto/update-goal-comment.dto'

interface RequestWithUser extends Request {
  user: AuthUser
}

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('selection-info')
  @Roles(RoleName.NAVIGATOR)
  async getSelectionInfo(@Req() req: RequestWithUser) {
    return this.goalsService.getSelectionInfo(req.user.userId)
  }

  @Post('select')
  @Roles(RoleName.NAVIGATOR)
  async selectGoals(@Req() req: RequestWithUser, @Body() dto: SelectGoalsDto) {
    return this.goalsService.selectGoals(req.user.userId, dto)
  }

  @Get('my')
  @Roles(RoleName.NAVIGATOR)
  async listMyGoals(@Req() req: RequestWithUser) {
    return this.goalsService.listMyGoals(req.user.userId)
  }

  @Get('team')
  @Roles(RoleName.NAVIGATOR)
  async listTeamGoals(@Req() req: RequestWithUser) {
    return this.goalsService.listTeamGoalsForVoting(req.user)
  }

  @Post(':userGoalId/progress')
  @Roles(RoleName.NAVIGATOR)
  async addProgress(
    @Req() req: RequestWithUser,
    @Param('userGoalId') userGoalId: string,
    @Body() dto: GoalProgressDto
  ) {
    return this.goalsService.addProgress(req.user, userGoalId, dto)
  }

  @Patch(':userGoalId/comment')
  @Roles(RoleName.NAVIGATOR)
  async updateComment(
    @Req() req: RequestWithUser,
    @Param('userGoalId') userGoalId: string,
    @Body() dto: UpdateGoalCommentDto
  ) {
    return this.goalsService.updateComment(req.user, userGoalId, dto)
  }

  @Post(':userGoalId/react')
  @Roles(RoleName.NAVIGATOR)
  async reactToGoal(@Req() req: RequestWithUser, @Param('userGoalId') userGoalId: string) {
    return this.goalsService.reactToGoal(req.user, userGoalId)
  }

  @Post(':userGoalId/confirm')
  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  async confirmGoal(@Req() req: RequestWithUser, @Param('userGoalId') userGoalId: string) {
    return this.goalsService.confirmGoal(req.user, userGoalId)
  }

  @Get('pending')
  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  async listPending(@Req() req: RequestWithUser, @Query('teamId') teamId?: string) {
    return this.goalsService.listPendingConfirmations(req.user, teamId ?? null)
  }
}
