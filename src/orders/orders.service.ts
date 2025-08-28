import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { generateOrderId, generateTicketId, generateQrCode } from '../common/utils/id.util';
import { PaginatedResponseDto } from '../common/dto/response.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tenantId: string, createOrderDto: CreateOrderDto) {
    const { eventId, priceOptionId, quantity, userInfo } = createOrderDto;

    // 验证演出是否存在且可购买
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        priceOptions: {
          where: { id: priceOptionId, status: 'ACTIVE' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('演出不存在');
    }

    if (event.status !== 'ON_SALE') {
      throw new BadRequestException('演出当前不可购买');
    }

    if (event.tenantId !== tenantId) {
      throw new ForbiddenException('无权限购买该演出');
    }

    const priceOption = event.priceOptions[0];
    if (!priceOption) {
      throw new NotFoundException('价格选项不存在或已禁用');
    }

    if (priceOption.remainingCount < quantity) {
      throw new BadRequestException('余票不足');
    }

    // 计算总金额
    const totalAmount = Number(priceOption.price) * quantity;

    // 创建订单和票券
    const order = await this.prisma.$transaction(async (tx) => {
      // 更新剩余票数
      await tx.priceOption.update({
        where: { id: priceOptionId },
        data: { remainingCount: { decrement: quantity } },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { remainingSeats: { decrement: quantity } },
      });

      // 创建订单
      const orderId = generateOrderId();
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          tenantId,
          userId,
          eventId,
          priceOptionId,
          quantity,
          totalAmount,
          userName: userInfo.name,
          userPhone: userInfo.phone,
          status: 'PENDING',
        },
      });

      // 创建票券
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketId = generateTicketId();
        const qrCode = generateQrCode(orderId, ticketId);
        
        const ticket = await tx.ticket.create({
          data: {
            id: ticketId,
            orderId,
            qrCode,
            seatNo: `${i + 1}`, // 简单的座位号生成，可以根据实际需求优化
            status: 'VALID',
          },
        });
        tickets.push(ticket);
      }

      return {
        ...createdOrder,
        tickets,
        event,
        priceOption,
      };
    });

    return order;
  }

  async findOne(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            priceOptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
        priceOption: true,
        tickets: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 如果传入了userId，验证订单所有权
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('无权限查看该订单');
    }

    return order;
  }

  async findUserOrders(userId: string, queryDto: QueryOrdersDto) {
    const { tenantId, page, pageSize, status } = queryDto;
    
    const where: any = { userId };
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (status) {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              poster: true,
              venue: true,
              address: true,
              eventDate: true,
              eventTime: true,
            },
          },
          priceOption: {
            select: {
              name: true,
              price: true,
            },
          },
          tickets: {
            select: {
              id: true,
              seatNo: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return new PaginatedResponseDto(orders, total, page, pageSize);
  }

  async cancel(id: string, userId: string) {
    const order = await this.findOne(id, userId);

    if (order.status !== 'PENDING') {
      throw new BadRequestException('只能取消待支付的订单');
    }

    // 检查是否超过取消时限（这里设为30分钟）
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (order.createdAt < thirtyMinutesAgo) {
      throw new BadRequestException('订单超过取消时限');
    }

    // 取消订单并释放库存
    return this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      const cancelledOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // 释放库存
      await tx.priceOption.update({
        where: { id: order.priceOptionId },
        data: { remainingCount: { increment: order.quantity } },
      });

      await tx.event.update({
        where: { id: order.eventId },
        data: { remainingSeats: { increment: order.quantity } },
      });

      return cancelledOrder;
    });
  }

  async updatePaymentStatus(orderId: string, transactionId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('订单状态异常');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        transactionId,
        paidAt: new Date(),
        payMethod: 'wechat',
      },
    });
  }

  // 管理员专用方法
  async findAllOrders(queryDto: QueryOrdersDto) {
    const { tenantId, page, pageSize, status } = queryDto;
    
    const where: any = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (status) {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              venue: true,
              eventDate: true,
              eventTime: true,
            },
          },
          priceOption: {
            select: {
              name: true,
              price: true,
            },
          },
          user: {
            select: {
              id: true,
              nickname: true,
              phone: true,
            },
          },
          tickets: {
            select: {
              id: true,
              seatNo: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return new PaginatedResponseDto(orders, total, page, pageSize);
  }
}