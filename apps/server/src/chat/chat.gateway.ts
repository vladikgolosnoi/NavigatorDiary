import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: { origin: '*' }
})
export class ChatGateway {
  @WebSocketServer()
  server: Server

  private static instance: ChatGateway | null = null

  afterInit() {
    ChatGateway.instance = this
  }

  static emitToTeam(teamId: string, event: string, payload: unknown) {
    if (!ChatGateway.instance?.server) {
      return
    }
    ChatGateway.instance.server.to(`team:${teamId}`).emit(event, payload)
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() body: { teamId?: string }, @ConnectedSocket() socket: Socket) {
    if (!body?.teamId) {
      return { ok: false }
    }
    socket.join(`team:${body.teamId}`)
    return { ok: true }
  }
}
