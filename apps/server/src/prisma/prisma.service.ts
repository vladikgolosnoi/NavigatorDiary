import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit() {
    // Не блокируем старт HTTP-сервера, пока free-БД Render «просыпается».
    void this.$connect().catch((error: unknown) => {
      this.logger.warn('Первичное подключение к БД не удалось, повтор при первом запросе')
      this.logger.debug(String(error))
    })
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
