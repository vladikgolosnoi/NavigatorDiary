import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    const shutdown = async () => {
      await app.close()
      process.exit(0)
    }

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  }
}
