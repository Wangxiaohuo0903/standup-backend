import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { generateId } from '../common/utils/id.util';
import { PaginatedResponseDto } from '../common/dto/response.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const { priceOptions, ...eventData } = createEventDto;
    
    // 验证租户存在
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createEventDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    // 计算总座位数
    const totalSeats = priceOptions.reduce((sum, option) => sum + option.totalCount, 0);

    const event = await this.prisma.$transaction(async (tx) => {
      // 创建演出
      const createdEvent = await tx.event.create({
        data: {
          id: generateId(),
          ...eventData,
          totalSeats,
          remainingSeats: totalSeats,
          eventDate: new Date(eventData.eventDate),
          eventTime: new Date(`1970-01-01T${eventData.eventTime}:00.000Z`),
          status: 'UPCOMING',
        },
      });

      // 创建价格选项
      const createdPriceOptions = await Promise.all(
        priceOptions.map((option, index) =>
          tx.priceOption.create({
            data: {
              id: generateId(),
              eventId: createdEvent.id,
              ...option,
              remainingCount: option.totalCount,
              sortOrder: option.sortOrder ?? index,
            },
          })
        )
      );

      return {
        ...createdEvent,
        priceOptions: createdPriceOptions,
      };
    });

    return event;
  }

  async findAll(queryDto: QueryEventsDto) {
    const { tenantId, page, pageSize, status, date, city } = queryDto;
    
    const where: any = { tenantId };
    
    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (date) {
      where.eventDate = new Date(date);
    }
    
    if (city) {
      where.city = city;
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          priceOptions: {
            where: { status: 'ACTIVE' },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { eventDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);

    return new PaginatedResponseDto(events, total, page, pageSize);
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        priceOptions: {
          where: { status: 'ACTIVE' },
          orderBy: { sortOrder: 'asc' },
        },
        tenant: true,
      },
    });

    if (!event) {
      throw new NotFoundException('演出不存在');
    }

    return event;
  }

  async getHomeData(tenantId: string) {
    // 验证租户存在
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 获取即将开始的演出（未来7天内）
    const upcoming = await this.prisma.event.findMany({
      where: {
        tenantId,
        eventDate: {
          gte: today,
          lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { in: ['UPCOMING', 'ON_SALE'] },
      },
      include: {
        priceOptions: {
          where: { status: 'ACTIVE' },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { eventDate: 'asc' },
      take: 10,
    });

    // 获取推荐演出（正在售票的）
    const recommended = await this.prisma.event.findMany({
      where: {
        tenantId,
        status: 'ON_SALE',
        eventDate: { gte: today },
      },
      include: {
        priceOptions: {
          where: { status: 'ACTIVE' },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // 即将开票的演出
    const upcomingSale = await this.prisma.event.findMany({
      where: {
        tenantId,
        status: 'UPCOMING',
        eventDate: { gte: today },
      },
      include: {
        priceOptions: {
          where: { status: 'ACTIVE' },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { eventDate: 'asc' },
      take: 6,
    });

    return {
      upcoming,
      recommended,
      upcomingSale,
      // 后续可扩展 banners 和 merch
      banners: [],
      merch: [],
    };
  }

  async getCalendarData(tenantId: string, year: number, month: number) {
    // 验证租户存在
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    if (month < 1 || month > 12) {
      throw new BadRequestException('月份必须在1-12之间');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const events = await this.prisma.event.findMany({
      where: {
        tenantId,
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        priceOptions: {
          where: { status: 'ACTIVE' },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { eventTime: 'asc' },
    });

    // 按日期分组
    const calendarData: Record<string, any[]> = {};
    
    events.forEach((event) => {
      const dateKey = event.eventDate.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(event);
    });

    return calendarData;
  }

  async updateStatus(id: string, status: string) {
    const validStatuses = ['UPCOMING', 'ON_SALE', 'SOLD_OUT', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('无效的状态');
    }

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('演出不存在');
    }

    return this.prisma.event.update({
      where: { id },
      data: { status: status as any },
    });
  }
}