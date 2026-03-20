import { Controller, Get, Query, Res } from '@nestjs/common'
import { GoalStatus, RoleName, SpecialtyLevelName, SpecialtyStatus } from '@prisma/client'
import { Response } from 'express'
import { Roles } from '../auth/decorators/roles.decorator'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private buildFilters(query: {
    teamId?: string
    role?: RoleName
    goalStatus?: GoalStatus
    specialtyStatus?: SpecialtyStatus
    specialtyLevel?: SpecialtyLevelName
  }) {
    return {
      teamId: query.teamId ?? null,
      role: query.role ?? null,
      goalStatus: query.goalStatus ?? null,
      specialtyStatus: query.specialtyStatus ?? null,
      specialtyLevel: query.specialtyLevel ?? null
    }
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/overview')
  async getOrganizerOverview(
    @Query('teamId') teamId?: string,
    @Query('role') role?: RoleName,
    @Query('goalStatus') goalStatus?: GoalStatus,
    @Query('specialtyStatus') specialtyStatus?: SpecialtyStatus,
    @Query('specialtyLevel') specialtyLevel?: SpecialtyLevelName
  ) {
    return this.analyticsService.getOrganizerOverview(
      this.buildFilters({ teamId, role, goalStatus, specialtyStatus, specialtyLevel })
    )
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/team-summary')
  async exportTeamSummary(
    @Res() res: Response,
    @Query('teamId') teamId: string | undefined,
    @Query('role') role?: RoleName,
    @Query('goalStatus') goalStatus?: GoalStatus,
    @Query('specialtyStatus') specialtyStatus?: SpecialtyStatus,
    @Query('specialtyLevel') specialtyLevel?: SpecialtyLevelName
  ) {
    const csv = await this.analyticsService.exportTeamSummaryCsv(
      this.buildFilters({ teamId, role, goalStatus, specialtyStatus, specialtyLevel })
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-team-summary.csv"')
    res.send(`\uFEFF${csv}`)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/goals')
  async exportGoals(
    @Res() res: Response,
    @Query('teamId') teamId: string | undefined,
    @Query('role') role?: RoleName,
    @Query('goalStatus') goalStatus?: GoalStatus,
    @Query('specialtyStatus') specialtyStatus?: SpecialtyStatus,
    @Query('specialtyLevel') specialtyLevel?: SpecialtyLevelName
  ) {
    const csv = await this.analyticsService.exportGoalsCsv(
      this.buildFilters({ teamId, role, goalStatus, specialtyStatus, specialtyLevel })
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-goals.csv"')
    res.send(`\uFEFF${csv}`)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('organizer/export/specialties')
  async exportSpecialties(
    @Res() res: Response,
    @Query('teamId') teamId: string | undefined,
    @Query('role') role?: RoleName,
    @Query('goalStatus') goalStatus?: GoalStatus,
    @Query('specialtyStatus') specialtyStatus?: SpecialtyStatus,
    @Query('specialtyLevel') specialtyLevel?: SpecialtyLevelName
  ) {
    const csv = await this.analyticsService.exportSpecialtiesCsv(
      this.buildFilters({ teamId, role, goalStatus, specialtyStatus, specialtyLevel })
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="navigator-specialties.csv"')
    res.send(`\uFEFF${csv}`)
  }
}
