import { Controller, Get, Res } from '@nestjs/common'
import { RoleName } from '@prisma/client'
import { Response } from 'express'
import { Roles } from '../auth/decorators/roles.decorator'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/overview')
  async getOrganizerOverview() {
    return this.analyticsService.getOrganizerOverview()
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/team-summary')
  async exportTeamSummary(@Res() res: Response) {
    const csv = await this.analyticsService.exportTeamSummaryCsv()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-team-summary.csv"')
    res.send(`\uFEFF${csv}`)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/goals')
  async exportGoals(@Res() res: Response) {
    const csv = await this.analyticsService.exportGoalsCsv()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-goals.csv"')
    res.send(`\uFEFF${csv}`)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/specialties')
  async exportSpecialties(@Res() res: Response) {
    const csv = await this.analyticsService.exportSpecialtiesCsv()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-specialties.csv"')
    res.send(`\uFEFF${csv}`)
  }
}
