import { Controller, Put, Get, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/user.decorator';
import { ApiResponseDto } from '../common/dto/response.dto';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      user.userId,
      updateProfileDto,
    );
    return ApiResponseDto.success(updatedUser, '用户信息更新成功');
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: RequestUser) {
    const userProfile = await this.usersService.getUserProfile(user.userId);
    return ApiResponseDto.success(userProfile, '获取用户信息成功');
  }
}