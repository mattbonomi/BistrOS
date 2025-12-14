export type TableStatus = 'LIBRE' | 'ABIERTA' | 'PENDIENTE' | 'OCUPADA' | 'PAGADA';
export type PendingReason = 'PRODUCTOS' | 'CAMARERO' | 'CUENTA' | null;
export type OrderState = 'RECIBIDO' | 'EN_PREPARACION' | 'LISTO' | 'EN_CAMINO' | 'ENTREGADO';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  total: number;
  state: OrderState;
  timestamps: Record<OrderState, number | null>;
  createdAt: number;
}

export interface Table {
  id: string;
  status: TableStatus;
  pendingReason: PendingReason;
  connectedDevices: number;
  cart: CartItem[];
  currentOrderId: string | null;
  openedAt: number | null;
  lastEventAt: number | null;
}

export interface TablePerformance {
  tableId: string;
  revenue: number;
  occupancyCount: number;
}

export interface RecommendedTable {
  tableId: string;
  reason: 'BAJO_USO' | 'ROTACION_MEDIA';
  usageCount: number;
}

export interface WeatherMetric {
  condition: string;
  customers: number;
  revenue: number;
  ticket: number;
}

export interface DashboardMetrics {
  totalSessions: number;
  weeklySessions: { day: string; count: number }[];
  abandonedCartsRate: number;
  conversionRate: number;
  averageStayMinutes: number;
  salesByWeather: WeatherMetric[];
  weeklySales: { day: string; amount: number }[];
  dailyEngagement: { day: string; conversion: number; abandonment: number; avgTime: number }[];
  popularProducts: { name: string; count: number }[];
  deadProducts: { name: string; count: number }[];
  secondRoundRate: number;
  tablePerformance: TablePerformance[];
  occupancyRate: number;
  recommendedAllocation: RecommendedTable[];
}

export type EventType = 'SCAN_QR' | 'ADD_TO_CART' | 'PLACE_ORDER' | 'REQUEST_WAITER' | 'REQUEST_BILL' | 'ORDER_UPDATE' | 'CLOSE_TABLE' | 'PAYMENT_COMPLETED';

export interface AnalyticEvent {
  id: string;
  timestamp: number;
  tableId: string;
  type: EventType;
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}
