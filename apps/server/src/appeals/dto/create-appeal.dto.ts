import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateAppealDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string

  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  message: string
}
