import { IsOptional, IsString } from 'class-validator'

export class GoalProgressDto {
  @IsOptional()
  @IsString()
  note?: string
}
