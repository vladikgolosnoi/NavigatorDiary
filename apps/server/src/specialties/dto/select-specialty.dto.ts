import { IsString } from 'class-validator'

export class SelectSpecialtyDto {
  @IsString()
  specialtyId: string

  @IsString()
  levelId: string
}
