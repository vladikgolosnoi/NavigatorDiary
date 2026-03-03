import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string

  @IsOptional()
  @IsString()
  middleName?: string

  @IsOptional()
  @IsDateString()
  birthDate?: string

  @IsOptional()
  @IsEmail()
  email?: string
}
