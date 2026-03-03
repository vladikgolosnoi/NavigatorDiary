import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RoleName } from '@prisma/client'
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) {
      return true
    }

    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as { role?: RoleName }

    if (!user?.role) {
      return false
    }

    return requiredRoles.includes(user.role)
  }
}
