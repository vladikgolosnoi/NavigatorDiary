import { IsString, MinLength } from 'class-validator'

export class ResolvePasswordResetRequestDto {
  @IsString()
  @MinLength(3)
  login: string

  @IsString()
  @MinLength(6)
  newPassword: string
}
