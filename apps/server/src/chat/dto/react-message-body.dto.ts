import { IsString } from 'class-validator'

export class ReactMessageBodyDto {
  @IsString()
  messageId: string

  @IsString()
  reaction: string
}
