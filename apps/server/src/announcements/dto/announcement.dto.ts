import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class AnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  body: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
