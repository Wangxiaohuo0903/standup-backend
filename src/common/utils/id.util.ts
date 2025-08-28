import { randomBytes } from 'crypto';

export function generateId(length: number = 16): string {
  return randomBytes(length).toString('hex');
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(4).toString('hex');
  return `ORD${timestamp}${random}`;
}

export function generateTicketId(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(4).toString('hex');
  return `TKT${timestamp}${random}`;
}

export function generateQrCode(orderId: string, ticketId: string): string {
  const data = `${orderId}_${ticketId}_${Date.now()}`;
  return Buffer.from(data).toString('base64').replace(/[=+/]/g, '');
}