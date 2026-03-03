import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateGoalCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string
}
