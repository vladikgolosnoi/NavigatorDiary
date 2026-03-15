import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class GoalProgressDto {
  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  step?: number
}
