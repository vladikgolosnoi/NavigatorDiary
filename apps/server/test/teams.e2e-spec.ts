import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { TeamsController } from '../src/teams/teams.controller'
import { TeamsService } from '../src/teams/teams.service'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Teams API (e2e)', () => {
  let app: INestApplication

  const mockPrisma = {
    team: {
      findMany: jest.fn()
    }
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [TeamsService, { provide: PrismaService, useValue: mockPrisma }]
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns active teams list', async () => {
    mockPrisma.team.findMany.mockResolvedValue([
      { id: 'team-1', name: 'Навигаторы', city: 'Ростов-на-Дону', institution: 'Гимназия №1' },
      { id: 'team-2', name: 'Следопыты', city: 'Казань', institution: 'Лицей №5' }
    ])

    const response = await request(app.getHttpServer()).get('/api/teams/public').expect(200)

    expect(response.body).toHaveLength(2)
    expect(response.body[0].id).toBe('team-1')
  })
})
