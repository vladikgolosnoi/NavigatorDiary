import { IsString, MaxLength, MinLength } from 'class-validator'

export class ReplyAppealDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string
}
