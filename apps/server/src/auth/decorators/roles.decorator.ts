import { SetMetadata } from '@nestjs/common'
import { RoleName } from '@prisma/client'
import { ROLES_KEY } from '../constants'

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles)
