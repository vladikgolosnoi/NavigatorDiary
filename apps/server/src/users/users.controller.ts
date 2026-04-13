import { Body, Controller, Get, Patch, Post, Req, BadRequestException, Param, Query } from '@nestjs/common'
import { UsersService } from './users.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { Request } from 'express'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleName } from '@prisma/client'

interface RequestWithUser extends Request {
  user: {
    userId: string
    teamId?: string | null
    role?: RoleName
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId)
  }

  @Patch('me')
  async updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto)
  }

  @Post('me/change-password')
  async changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto)
  }

  @Get('search')
  @Roles(RoleName.ORGANIZER)
  async searchUsers(@Query('query') query: string) {
    return this.usersService.searchUsers(query)
  }

  @Post(':userId/reset-password')
  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  async resetPassword(
    @Req() req: RequestWithUser,
    @Body() dto: ResetPasswordDto,
    @Param('userId') userId: string
  ) {
    return this.usersService.resetPassword(req.user.userId, req.user.role ?? RoleName.NAVIGATOR, req.user.teamId ?? null, userId, dto)
  }

  @Get('pending')
  @Roles(RoleName.LEADER, RoleName.ORGANIZER)
  async listPending(@Req() req: RequestWithUser) {
    if (req.user.role === RoleName.ORGANIZER) {
      return this.usersService.listPendingUsers()
    }
    if (!req.user.teamId) {
      throw new BadRequestException('Команда не найдена')
    }
    return this.usersService.listPendingUsers(req.user.teamId)
  }
}
