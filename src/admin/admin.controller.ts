import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Query, 
  Body, 
  UseGuards, 
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { StatsQueryDto } from './dto/stats-query.dto';
import { QueryEventsDto } from '../events/dto/query-events.dto';
import { QueryOrdersDto } from '../orders/dto/query-orders.dto';
import { CreateEventDto } from '../events/dto/create-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/dto/response.dto';
import { EventsService } from '../events/events.service';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly eventsService: EventsService,
  ) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() adminLoginDto: AdminLoginDto) {
    const result = await this.adminService.login(adminLoginDto);
    return ApiResponseDto.success(result, '管理员登录成功');
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Query() statsQuery: StatsQueryDto) {
    const stats = await this.adminService.getStats(statsQuery);
    return ApiResponseDto.success(stats, '获取统计数据成功');
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async getEvents(@Query() queryDto: QueryEventsDto) {
    return this.adminService.getEvents(queryDto);
  }

  @Post('events')
  @UseGuards(JwtAuthGuard)
  async createEvent(@Body() createEventDto: CreateEventDto) {
    const event = await this.eventsService.create(createEventDto);
    return ApiResponseDto.success(event, '演出创建成功');
  }

  @Put('events/:id')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    // 简化的更新逻辑 - 实际需要完整的DTO验证
    const event = await this.eventsService.updateStatus(id, updateData.status);
    return ApiResponseDto.success(event, '演出更新成功');
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getOrders(@Query() queryDto: QueryOrdersDto) {
    return this.adminService.getOrders(queryDto);
  }

  @Put('orders/:id/refund')
  @UseGuards(JwtAuthGuard)
  async processRefund(
    @Param('id') orderId: string,
    @Query('tenantId') tenantId: string,
  ) {
    const order = await this.adminService.processRefund(orderId, tenantId);
    return ApiResponseDto.success(order, '退款处理成功');
  }
}