import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { ChatService } from './chat.service'
import { CreateMessageDto } from './dto/create-message.dto'
import { ReactMessageBodyDto } from './dto/react-message-body.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'
import { Request } from 'express'
import { AuthUser } from '../goals/goals.types'

interface RequestWithUser extends Request {
  user: AuthUser
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER)
  async listMessages(@Req() req: RequestWithUser, @Query('limit') limit?: string) {
    if (!req.user.teamId) {
      return []
    }
    const parsedLimit = limit ? Math.min(Number(limit), 200) : 50
    return this.chatService.listMessages(req.user.teamId, Number.isFinite(parsedLimit) ? parsedLimit : 50)
  }

  @Post('messages')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER)
  async createMessage(@Req() req: RequestWithUser, @Body() dto: CreateMessageDto) {
    return this.chatService.createUserMessage(req.user, dto.content)
  }

  @Post('messages/react')
  @Roles(RoleName.NAVIGATOR, RoleName.LEADER)
  async reactToMessage(@Req() req: RequestWithUser, @Body() dto: ReactMessageBodyDto) {
    return this.chatService.reactToMessage(req.user, dto.messageId, dto.reaction)
  }
}
