import { Controller, Get, Query, Res } from '@nestjs/common'
import { RoleName } from '@prisma/client'
import { Response } from 'express'
import { Roles } from '../auth/decorators/roles.decorator'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/overview')
  async getOrganizerOverview(@Query('teamId') teamId?: string) {
    return this.analyticsService.getOrganizerOverview(teamId ?? null)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/team-summary')
  async exportTeamSummary(@Query('teamId') teamId: string | undefined, @Res() res: Response) {
    const csv = await this.analyticsService.exportTeamSummaryCsv(teamId ?? null)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-team-summary.csv"')
    res.send(`\uFEFF${csv}`)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/goals')
  async exportGoals(@Query('teamId') teamId: string | undefined, @Res() res: Response) {
    const csv = await this.analyticsService.exportGoalsCsv(teamId ?? null)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-goals.csv"')
    res.send(`\uFEFF${csv}`)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/specialties')
  async exportSpecialties(@Query('teamId') teamId: string | undefined, @Res() res: Response) {
    const csv = await this.analyticsService.exportSpecialtiesCsv(teamId ?? null)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-specialties.csv"')
    res.send(`\uFEFF${csv}`)
  }
}
