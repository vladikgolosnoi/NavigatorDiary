import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class RegisterTeamDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  @IsNotEmpty()
  city: string

  @IsString()
  @IsNotEmpty()
  institution: string
}
