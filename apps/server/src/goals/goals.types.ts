import { RoleName } from '@prisma/client'

export type AuthUser = {
  userId: string
  role: RoleName
  teamId?: string | null
}
