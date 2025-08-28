import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Query, 
  Body, 
  UseGuards 
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/user.decorator';
import { ApiResponseDto } from '../common/dto/response.dto';

@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const order = await this.ordersService.create(
      user.userId,
      user.tenantId,
      createOrderDto,
    );
    return ApiResponseDto.success(order, '订单创建成功');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const order = await this.ordersService.findOne(id, user.userId);
    return ApiResponseDto.success(order, '获取订单详情成功');
  }

  @Get()
  async findUserOrders(
    @CurrentUser() user: RequestUser,
    @Query() queryDto: QueryOrdersDto,
  ) {
    // 确保用户只能查看自己租户下的订单
    queryDto.tenantId = user.tenantId;
    return this.ordersService.findUserOrders(user.userId, queryDto);
  }

  @Put(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const order = await this.ordersService.cancel(id, user.userId);
    return ApiResponseDto.success(order, '订单取消成功');
  }
}