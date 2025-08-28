import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../config/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { StatsQueryDto, StatsPeriod } from './dto/stats-query.dto';
import { QueryOrdersDto } from '../orders/dto/query-orders.dto';
import { QueryEventsDto } from '../events/dto/query-events.dto';
import { OrdersService } from '../orders/orders.service';
import { EventsService } from '../events/events.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly ordersService: OrdersService,
    private readonly eventsService: EventsService,
  ) {}

  async login(adminLoginDto: AdminLoginDto) {
    const { username, password, tenantId } = adminLoginDto;

    // 验证租户
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    // 简化的管理员验证 - 实际生产环境应该有专门的管理员表
    // 这里使用固定的管理员账户进行演示
    const validCredentials = this.validateAdminCredentials(username, password, tenantId);

    if (!validCredentials) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    // 生成管理员JWT token
    const payload = {
      adminId: `admin_${tenantId}`,
      username,
      tenantId,
      role: 'admin',
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      admin: {
        id: payload.adminId,
        username,
        tenantId,
        role: 'admin',
      },
      expiresIn: 7200, // 2小时
    };
  }

  private validateAdminCredentials(username: string, password: string, tenantId: string): boolean {
    // 简化的验证逻辑 - 生产环境应该从数据库验证
    const adminAccounts = {
      dt: { username: 'admin', password: 'admin123' },
      xclub: { username: 'admin', password: 'admin123' },
    };

    const account = adminAccounts[tenantId];
    return account && account.username === username && account.password === password;
  }

  async getStats(statsQuery: StatsQueryDto) {
    const { tenantId, period } = statsQuery;

    // 验证租户
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    const { startDate, endDate } = this.getPeriodRange(period);

    // 获取总体统计
    const [totalEvents, totalOrders, totalUsers] = await Promise.all([
      this.prisma.event.count({ where: { tenantId } }),
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.user.count(),
    ]);

    // 获取总收入
    const totalRevenueResult = await this.prisma.order.aggregate({
      where: {
        tenantId,
        status: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    const totalRevenue = Number(totalRevenueResult._sum.totalAmount || 0);

    // 获取指定时期的统计
    const [periodEvents, periodOrders, periodUsers] = await Promise.all([
      this.prisma.event.count({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // 获取指定时期的收入
    const periodRevenueResult = await this.prisma.order.aggregate({
      where: {
        tenantId,
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });

    const periodRevenue = Number(periodRevenueResult._sum.totalAmount || 0);

    return {
      totalEvents,
      totalOrders,
      totalRevenue,
      totalUsers,
      [period]: {
        events: periodEvents,
        orders: periodOrders,
        revenue: periodRevenue,
        users: periodUsers,
      },
    };
  }

  private getPeriodRange(period: StatsPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;

    switch (period) {
      case StatsPeriod.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case StatsPeriod.THIS_WEEK:
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case StatsPeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case StatsPeriod.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }

  async getEvents(queryDto: QueryEventsDto) {
    return this.eventsService.findAll(queryDto);
  }

  async getOrders(queryDto: QueryOrdersDto) {
    return this.ordersService.findAllOrders(queryDto);
  }

  async processRefund(orderId: string, tenantId: string) {
    // 验证订单属于该租户
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'PAID') {
      throw new UnauthorizedException('只有已支付的订单才能退款');
    }

    // 处理退款
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });
  }
}