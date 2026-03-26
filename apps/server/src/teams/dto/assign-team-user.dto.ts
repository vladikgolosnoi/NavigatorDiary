import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class AssignTeamUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  userId?: string

  @IsOptional()
  @IsEmail()
  email?: string
}
