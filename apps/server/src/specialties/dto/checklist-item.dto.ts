import { IsString } from 'class-validator'

export class ChecklistItemDto {
  @IsString()
  checklistItemId: string
}
