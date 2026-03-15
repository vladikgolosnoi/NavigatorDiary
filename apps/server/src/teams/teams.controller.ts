import { Controller, Get, Param } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { TeamsService } from './teams.service'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'

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
}
