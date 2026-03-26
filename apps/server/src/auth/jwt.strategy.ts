import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret'
    })
  }

  async validate(payload: { sub: string; role: string; teamId?: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true }
    })

    if (!user) {
      return { userId: payload.sub, role: payload.role, teamId: payload.teamId ?? null }
    }

    return {
      userId: user.id,
      role: user.role.name,
      teamId: user.teamId ?? null
    }
  }
}
