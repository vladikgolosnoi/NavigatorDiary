import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class RegisterTeamDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsOptional()
  @IsString()
  city?: string

  @IsString()
  @IsNotEmpty()
  institution: string
}
