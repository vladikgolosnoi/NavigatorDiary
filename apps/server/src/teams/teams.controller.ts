import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { TeamsService } from './teams.service'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { RegisterTeamDto } from '../auth/dto/register-team.dto'
import { AssignTeamUserDto } from './dto/assign-team-user.dto'

interface RequestWithUser {
  user: {
    userId: string
    role: RoleName
    teamId?: string | null
  }
}

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Public()
  @Get('public')
  async listPublic() {
    return this.teamsService.listPublic()
  }

  @Roles(RoleName.ORGANIZER)
  @Get('pending')
  async listPending() {
    return this.teamsService.listPending()
  }

  @Roles(RoleName.ORGANIZER)
  @Get(':teamId/users')
  async listActiveMembers(@Param('teamId') teamId: string) {
    return this.teamsService.listActiveMembers(teamId)
  }

  @Roles(RoleName.LEADER)
  @Post('leader/create')
  async createForLeader(@Req() req: RequestWithUser, @Body() dto: RegisterTeamDto) {
    const team = await this.teamsService.createForLeader(req.user.userId, dto)
    return {
      id: team.id,
      name: team.name,
      city: team.city,
      institution: team.institution,
      status: team.status
    }
  }

  @Roles(RoleName.ORGANIZER)
  @Post(':teamId/assign-user')
  async assignUserToTeam(
    @Param('teamId') teamId: string,
    @Body() dto: AssignTeamUserDto,
    @Req() req: RequestWithUser
  ) {
    return this.teamsService.assignUserToTeam(teamId, dto, req.user.userId)
  }
}
