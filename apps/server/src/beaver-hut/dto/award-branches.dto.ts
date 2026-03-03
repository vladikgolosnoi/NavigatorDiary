import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator'
import { BranchAwardType } from '@prisma/client'

export class AwardBranchesDto {
  @IsString()
  teamId: string

  @IsEnum(BranchAwardType)
  type: BranchAwardType

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[]
}
