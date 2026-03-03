import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class RegisterUserDto {
  @IsString()
  @MinLength(2)
  firstName: string

  @IsString()
  @MinLength(2)
  lastName: string

  @IsOptional()
  @IsString()
  middleName?: string

  @IsDateString()
  birthDate: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @IsNotEmpty()
  teamId: string
}
