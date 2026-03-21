import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import type { NextFunction, Request, Response } from 'express'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { PrismaService } from './prisma/prisma.service'

function resolveWebDistPath() {
  const candidates = [
    join(process.cwd(), 'apps/web/dist'),
    join(__dirname, '../../../web/dist')
  ]

  return candidates.find((candidate) => existsSync(join(candidate, 'index.html')))
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors({
    origin: true,
    credentials: true
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  )
  app.setGlobalPrefix('api')

  // Ищем фронтенд и отдаем его независимо от рабочего каталога процесса.
  const webDistPath = resolveWebDistPath()
  const webIndexPath = webDistPath ? join(webDistPath, 'index.html') : null
  if (webDistPath && webIndexPath) {
    app.useStaticAssets(webDistPath, { index: false })
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') {
        next()
        return
      }
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        next()
        return
      }
      res.sendFile(webIndexPath)
    })
  }

  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)
  const port = process.env.PORT ? Number(process.env.PORT) : 3000
  await app.listen(port)
}

bootstrap()
