import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreatePasswordResetRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  loginHint?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  fullName?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  teamName?: string

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  contact: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string
}
