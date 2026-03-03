import { ArrayMinSize, ArrayMaxSize, IsArray, IsString } from 'class-validator'

export class SelectGoalsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  goalIds: string[]
}
