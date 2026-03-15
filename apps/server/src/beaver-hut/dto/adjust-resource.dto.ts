import { BeaverResourceType } from '@prisma/client'
import { IsEnum, IsInt, IsOptional, IsString, NotEquals } from 'class-validator'

export class AdjustResourceDto {
  @IsString()
  userId: string

  @IsEnum(BeaverResourceType)
  resourceType: BeaverResourceType

  @IsInt()
  @NotEquals(0)
  amount: number

  @IsOptional()
  @IsString()
  note?: string
}
