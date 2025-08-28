import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Query, 
  Body, 
  UseGuards,
  ParseIntPipe 
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/dto/response.dto';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('home')
  async getHomeData(@Query('tenantId') tenantId: string) {
    const data = await this.eventsService.getHomeData(tenantId);
    return ApiResponseDto.success(data, '获取首页数据成功');
  }

  @Get('calendar/:year/:month')
  async getCalendarData(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Query('tenantId') tenantId: string,
  ) {
    const data = await this.eventsService.getCalendarData(tenantId, year, month);
    return ApiResponseDto.success(data, '获取日历数据成功');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    return ApiResponseDto.success(event, '获取演出详情成功');
  }

  @Get()
  async findAll(@Query() queryDto: QueryEventsDto) {
    return this.eventsService.findAll(queryDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEventDto: CreateEventDto) {
    const event = await this.eventsService.create(createEventDto);
    return ApiResponseDto.success(event, '演出创建成功');
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const event = await this.eventsService.updateStatus(id, status);
    return ApiResponseDto.success(event, '演出状态更新成功');
  }
}