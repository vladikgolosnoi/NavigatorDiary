import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ChatMessageType } from '@prisma/client'
import { ChatGateway } from './chat.gateway'
import { AuthUser } from '../goals/goals.types'

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listMessages(teamId: string, limit = 50) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: true,
        reactions: true
      }
    })

    return messages.map((message) => ({
      id: message.id,
      teamId: message.teamId,
      type: message.type,
      content: message.content,
      createdAt: message.createdAt,
      user: message.user
        ? {
            id: message.user.id,
            firstName: message.user.firstName,
            lastName: message.user.lastName
          }
        : null,
      reactions: message.reactions.map((reaction) => ({
        id: reaction.id,
        userId: reaction.userId,
        reaction: reaction.reaction,
        createdAt: reaction.createdAt
      }))
    }))
  }

  async createUserMessage(user: AuthUser, content: string) {
    if (!user.teamId) {
      throw new ForbiddenException('Пользователь не состоит в команде')
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        teamId: user.teamId,
        userId: user.userId,
        type: ChatMessageType.USER,
        content
      },
      include: {
        user: true,
        reactions: true
      }
    })

    const payload = this.mapMessage(message)
    ChatGateway.emitToTeam(user.teamId, 'chat:message', payload)

    return payload
  }

  async createSystemMessage(teamId: string, content: string) {
    const message = await this.prisma.chatMessage.create({
      data: {
        teamId,
        type: ChatMessageType.SYSTEM,
        content
      },
      include: {
        reactions: true
      }
    })

    const payload = this.mapMessage(message)
    ChatGateway.emitToTeam(teamId, 'chat:message', payload)

    return payload
  }

  async reactToMessage(user: AuthUser, messageId: string, reaction: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      throw new NotFoundException('Сообщение не найдено')
    }

    if (message.teamId !== user.teamId) {
      throw new ForbiddenException('Нельзя реагировать на сообщения другой команды')
    }

    const existing = await this.prisma.chatReaction.findUnique({
      where: { messageId_userId_reaction: { messageId, userId: user.userId, reaction } }
    })

    if (existing) {
      throw new BadRequestException('Реакция уже поставлена')
    }

    const created = await this.prisma.chatReaction.create({
      data: {
        messageId,
        userId: user.userId,
        reaction
      }
    })

    const payload = {
      messageId,
      reaction: created.reaction,
      userId: created.userId,
      createdAt: created.createdAt
    }

    ChatGateway.emitToTeam(message.teamId, 'chat:reaction', payload)

    return payload
  }

  private mapMessage(message: {
    id: string
    teamId: string
    type: ChatMessageType
    content: string
    createdAt: Date
    user?: { id: string; firstName: string; lastName: string } | null
    reactions?: { id: string; userId: string; reaction: string; createdAt: Date }[]
  }) {
    return {
      id: message.id,
      teamId: message.teamId,
      type: message.type,
      content: message.content,
      createdAt: message.createdAt,
      user: message.user
        ? {
            id: message.user.id,
            firstName: message.user.firstName,
            lastName: message.user.lastName
          }
        : null,
      reactions: message.reactions?.map((reaction) => ({
        id: reaction.id,
        userId: reaction.userId,
        reaction: reaction.reaction,
        createdAt: reaction.createdAt
      }))
    }
  }
}
