import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { NotificationScope } from '@prisma/client'

export class NotificationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  body: string

  @IsEnum(NotificationScope)
  scope: NotificationScope

  @IsOptional()
  @IsString()
  teamId?: string

  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
