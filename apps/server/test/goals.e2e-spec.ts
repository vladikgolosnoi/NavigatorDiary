import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { GoalsController } from '../src/goals/goals.controller'
import { GoalsService } from '../src/goals/goals.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { ChatService } from '../src/chat/chat.service'
import { AuditService } from '../src/audit/audit.service'
import { RoleName } from '@prisma/client'

describe('Goals API (e2e)', () => {
  let app: INestApplication

  const mockPrisma = {
    goalSelection: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    goal: {
      findMany: jest.fn()
    }
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatService, useValue: { createSystemMessage: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } }
      ]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true
      })
    )
    app.setGlobalPrefix('api')
    app.use((req: { user?: unknown }, _res, next) => {
      req.user = { userId: 'user-1', role: RoleName.NAVIGATOR, teamId: 'team-1' }
      next()
    })
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('rejects selection over limit', async () => {
    await request(app.getHttpServer())
      .post('/api/goals/select')
      .send({ goalIds: Array.from({ length: 13 }, (_, index) => `g${index}`) })
      .expect(400)
  })

  it('selects goals and returns selection info', async () => {
    mockPrisma.goalSelection.findFirst.mockResolvedValue(null)
    mockPrisma.goal.findMany.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }])
    const selectedAt = new Date('2025-01-01T00:00:00.000Z')
    const nextEligibleAt = new Date('2025-04-01T00:00:00.000Z')
    mockPrisma.goalSelection.create.mockResolvedValue({
      id: 'sel-1',
      selectedAt,
      nextEligibleAt,
      goals: [
        { id: 'ug1', goalId: 'g1', userId: 'user-1' },
        { id: 'ug2', goalId: 'g2', userId: 'user-1' }
      ]
    })

    const response = await request(app.getHttpServer())
      .post('/api/goals/select')
      .send({ goalIds: ['g1', 'g2'] })
      .expect(201)

    expect(response.body.selectionId).toBe('sel-1')
    expect(response.body.goals).toHaveLength(2)
  })
})
