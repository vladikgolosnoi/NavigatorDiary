import { Controller, Get, Query } from '@nestjs/common'
import { CatalogsService } from './catalogs.service'

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('age-groups')
  async getAgeGroups() {
    return this.catalogsService.listAgeGroups()
  }

  @Get('spheres')
  async getSpheres(@Query('ageGroupId') ageGroupId?: string) {
    return this.catalogsService.listSpheres(ageGroupId)
  }

  @Get('competencies')
  async getCompetencies(
    @Query('sphereId') sphereId?: string,
    @Query('ageGroupId') ageGroupId?: string
  ) {
    return this.catalogsService.listCompetencies(sphereId, ageGroupId)
  }

  @Get('goals')
  async getGoals(
    @Query('competencyId') competencyId?: string,
    @Query('ageGroupId') ageGroupId?: string
  ) {
    return this.catalogsService.listGoals(competencyId, ageGroupId)
  }

  @Get('areas')
  async getAreas() {
    return this.catalogsService.listAreas()
  }

  @Get('specialties')
  async getSpecialties(@Query('areaId') areaId?: string) {
    return this.catalogsService.listSpecialties(areaId)
  }
}
