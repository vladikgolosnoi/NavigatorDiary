import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterTeamDto } from './dto/register-team.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { LoginDto } from './dto/login.dto'
import { CreatePasswordResetRequestDto } from './dto/create-password-reset-request.dto'
import { ResolvePasswordResetRequestDto } from './dto/resolve-password-reset-request.dto'
import { Request } from 'express'
import { Public } from './decorators/public.decorator'
import { Roles } from './decorators/roles.decorator'
import { RoleName } from '@prisma/client'

interface RequestWithUser extends Request {
  user: {
    userId: string
    role: string
    teamId?: string | null
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-team')
  @Public()
  async registerTeam(@Body() dto: RegisterTeamDto) {
    const team = await this.authService.registerTeam(dto)
    return {
      id: team.id,
      status: team.status
    }
  }

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterUserDto) {
    const user = await this.authService.registerUser(dto)
    return {
      id: user.id,
      status: user.status
    }
  }

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('password-reset-request')
  @Public()
  async createPasswordResetRequest(@Body() dto: CreatePasswordResetRequestDto) {
    const request = await this.authService.createPasswordResetRequest(dto)
    return {
      id: request.id,
      status: request.status
    }
  }

  @Roles(RoleName.ORGANIZER)
  @Post('password-reset-requests/:id/complete')
  async completePasswordResetRequest(
    @Param('id') requestId: string,
    @Req() req: RequestWithUser,
    @Body() dto: ResolvePasswordResetRequestDto
  ) {
    return this.authService.completePasswordResetRequest(requestId, req.user.userId, dto)
  }

  @Roles(RoleName.ORGANIZER)
  @Post('password-reset-requests/:id/cancel')
  async cancelPasswordResetRequest(@Param('id') requestId: string, @Req() req: RequestWithUser) {
    return this.authService.cancelPasswordResetRequest(requestId, req.user.userId)
  }

  @Roles(RoleName.ORGANIZER)
  @Get('password-reset-requests')
  async listPasswordResetRequests() {
    return this.authService.listPasswordResetRequests()
  }

  @Roles(RoleName.ORGANIZER)
  @Post('approve-team/:teamId')
  async approveTeam(@Param('teamId') teamId: string, @Req() req: RequestWithUser) {
    const team = await this.authService.approveTeam(teamId, req.user.userId)
    return {
      id: team.id,
      status: team.status,
      approvedAt: team.approvedAt
    }
  }

  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  @Post('approve-user/:userId')
  async approveUser(@Param('userId') userId: string, @Req() req: RequestWithUser) {
    const user = await this.authService.approveUser(userId, req.user.userId)
    return {
      id: user.id,
      status: user.status,
      approvedById: user.approvedById
    }
  }

  @Roles(RoleName.ORGANIZER)
  @Post('reject-team/:teamId')
  async rejectTeam(@Param('teamId') teamId: string, @Req() req: RequestWithUser) {
    const team = await this.authService.rejectTeam(teamId, req.user.userId)
    return {
      id: team.id,
      status: team.status,
      approvedAt: team.approvedAt
    }
  }

  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  @Post('reject-user/:userId')
  async rejectUser(@Param('userId') userId: string, @Req() req: RequestWithUser) {
    const user = await this.authService.rejectUser(userId, req.user.userId)
    return {
      id: user.id,
      status: user.status,
      approvedById: user.approvedById
    }
  }
}
