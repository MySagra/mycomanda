export type PrinterStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';

export interface Printer {
  id: string;
  name: string;
  ip?: string | null;
  mac?: string | null;
  port?: number;
  description?: string;
  status?: PrinterStatus;
}

export interface SSEOrderItem {
  id: string;
  quantity: number;
  orderId: number;
  foodId: string | null;
  unitPrice: string;
  unitSurcharge: string;
  total: string;
  notes: string | null;
  food: {
    id: string;
    name: string;
    printerId: string | null;
  };
}

export interface SSEOrder {
  id: string;
  displayCode: string;
  table: string | null;
  customer: string | null;
  createdAt: string;
  confirmedAt: string | null;
  ticketNumber: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'PARTIAL' | 'COMPLETED' | 'PICKED_UP' | 'CANCELLED';
  paymentMethod: string | null;
  subTotal: string;
  discount: string;
  surcharge: string;
  total: string;
  userId: string | null;
  cashRegisterId: string | null;
  orderItems: SSEOrderItem[];
}
