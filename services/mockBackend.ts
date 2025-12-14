import { MENU_ITEMS } from '../constants';
import { AnalyticEvent, CartItem, DashboardMetrics, Order, Table, TableStatus, OrderState, PendingReason, EventType, RecommendedTable, TablePerformance } from '../types';

class BistrOSBackend {
  private tables: Map<string, Table> = new Map();
  private orders: Map<string, Order> = new Map();
  private events: AnalyticEvent[] = [];
  
  // WebSocket Listeners
  private tableListeners: Map<string, Array<(table: Table) => void>> = new Map();
  private managerListeners: Array<() => void> = [];

  constructor() {
    this.seedTables();
  }

  // --- HELPERS ---

  private getTable(tableId: string): Table {
    let table = this.tables.get(tableId);
    if (!table) {
      // Lazy initialization if not seeded
      table = {
        id: tableId,
        status: 'LIBRE',
        pendingReason: null,
        connectedDevices: 0,
        cart: [],
        currentOrderId: null,
        openedAt: null,
        lastEventAt: null
      };
      this.tables.set(tableId, table);
    }
    return table;
  }

  private updateTable(table: Table) {
    table.lastEventAt = Date.now();
    this.tables.set(table.id, table);
    this.notifyTable(table.id);
    this.notifyManager();
  }

  private logEvent(tableId: string, type: EventType, payload?: any) {
    this.events.push({
      id: `evt-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      tableId,
      type,
      payload
    });
  }

  // --- CLIENT ENDPOINTS ---

  public scanQR(tableId: string): Table {
    const table = this.getTable(tableId);
    
    // TRANSITION: LIBRE -> ABIERTA
    if (table.status === 'LIBRE') {
      table.status = 'ABIERTA';
      table.openedAt = Date.now();
      table.pendingReason = null;
    }
    
    table.connectedDevices += 1;
    this.updateTable(table);
    this.logEvent(tableId, 'SCAN_QR');
    return table;
  }

  public getMenu() {
    return MENU_ITEMS;
  }

  public updateCart(tableId: string, productId: string, delta: number) {
    const table = this.getTable(tableId);
    
    const existingIndex = table.cart.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      const newItem = { ...table.cart[existingIndex] };
      newItem.quantity += delta;
      if (newItem.quantity <= 0) {
        table.cart.splice(existingIndex, 1);
      } else {
        table.cart[existingIndex] = newItem;
      }
    } else if (delta > 0) {
      table.cart.push({ productId, quantity: delta });
    }

    this.updateTable(table);
  }

  public placeOrder(tableId: string): Order | null {
    const table = this.getTable(tableId);
    if (table.cart.length === 0) return null;

    // Calculate Total
    const total = table.cart.reduce((acc, item) => {
      const p = MENU_ITEMS.find(prod => prod.id === item.productId);
      return acc + (p ? p.price * item.quantity : 0);
    }, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tableId,
      items: [...table.cart],
      total,
      state: 'RECIBIDO',
      timestamps: {
        RECIBIDO: Date.now(),
        EN_PREPARACION: null,
        LISTO: null,
        EN_CAMINO: null,
        ENTREGADO: null
      },
      createdAt: Date.now()
    };

    this.orders.set(newOrder.id, newOrder);

    // TRANSITION: ABIERTA -> PENDIENTE (Reason: PRODUCTOS)
    table.cart = []; // Clear cart
    table.currentOrderId = newOrder.id;
    table.status = 'PENDIENTE';
    table.pendingReason = 'PRODUCTOS';
    
    this.updateTable(table);
    this.logEvent(tableId, 'PLACE_ORDER', { orderId: newOrder.id });
    
    return newOrder;
  }

  public requestWaiter(tableId: string) {
    const table = this.getTable(tableId);
    table.status = 'PENDIENTE';
    table.pendingReason = 'CAMARERO';
    this.updateTable(table);
    this.logEvent(tableId, 'REQUEST_WAITER');
  }

  // This is kept for the "Camarero -> Cuenta" button if used separately, 
  // but the new flow uses payTable
  public requestBill(tableId: string, paymentMethod?: string) {
    const table = this.getTable(tableId);
    table.status = 'PENDIENTE';
    table.pendingReason = 'CUENTA';
    this.updateTable(table);
    this.logEvent(tableId, 'REQUEST_BILL', { paymentMethod });
  }

  public payTable(tableId: string, method: string, amount: number) {
      const table = this.getTable(tableId);
      table.status = 'PAGADA';
      table.pendingReason = null;
      this.updateTable(table);
      this.logEvent(tableId, 'PAYMENT_COMPLETED', { method, amount });
  }

  // Helper for Partial Ticket View
  public getTableOrders(tableId: string): Order[] {
      return Array.from(this.orders.values())
        .filter(o => o.tableId === tableId)
        .sort((a, b) => a.createdAt - b.createdAt);
  }

  // --- MANAGER ENDPOINTS ---

  public getTables(): Table[] {
    return Array.from(this.tables.values());
  }

  public getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  public getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public setOrderState(orderId: string, newState: OrderState) {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.state = newState;
    order.timestamps[newState] = Date.now();
    this.orders.set(orderId, order);

    const table = this.getTable(order.tableId);
    
    if (newState === 'EN_PREPARACION' && table.status === 'PENDIENTE' && table.pendingReason === 'PRODUCTOS') {
        table.status = 'OCUPADA';
        table.pendingReason = null;
    }
    if (newState === 'ENTREGADO') {
        table.status = 'OCUPADA';
        table.pendingReason = null;
    }

    this.updateTable(table);
    this.logEvent(table.id, 'ORDER_UPDATE', { orderId, newState });
  }

  public attendWaiter(tableId: string) {
    const table = this.getTable(tableId);
    if (table.pendingReason === 'CAMARERO') {
      table.status = 'OCUPADA';
      table.pendingReason = null;
      this.updateTable(table);
    }
  }

  public deliverBill(tableId: string) {
    const table = this.getTable(tableId);
    if (table.pendingReason === 'CUENTA') {
      table.status = 'OCUPADA';
      table.pendingReason = null;
      this.updateTable(table);
    }
  }

  public closeTable(tableId: string) {
    const table = this.getTable(tableId);
    table.status = 'LIBRE';
    table.pendingReason = null;
    table.cart = [];
    table.currentOrderId = null;
    table.connectedDevices = 0;
    table.openedAt = null;

    this.updateTable(table);
    this.logEvent(tableId, 'CLOSE_TABLE');
  }

  public getDashboardMetrics(): DashboardMetrics {
     const occupancyRate = 78;
     
     // 1. Get Live Data
     const allTables = this.getTables();
     const freeTables = allTables.filter(t => t.status === 'LIBRE');
     const freeRatio = freeTables.length / allTables.length;

     // 2. Historical Data
     const tablePerformance: TablePerformance[] = [
         { tableId: '4', revenue: 450000, occupancyCount: 100 }, 
         { tableId: '7', revenue: 410000, occupancyCount: 82 }, 
         { tableId: '1', revenue: 395000, occupancyCount: 65 },
         { tableId: '9', revenue: 280000, occupancyCount: 40 },
         { tableId: '3', revenue: 265000, occupancyCount: 22 },
         { tableId: '6', revenue: 240000, occupancyCount: 18 },
         { tableId: '2', revenue: 210000, occupancyCount: 15 },
         { tableId: '5', revenue: 195000, occupancyCount: 12 },
         { tableId: '8', revenue: 98000, occupancyCount: 10 },
         { tableId: '10', revenue: 85000, occupancyCount: 8 },
         { tableId: '11', revenue: 72000, occupancyCount: 5 },
         { tableId: '12', revenue: 65000, occupancyCount: 2 },
     ];

     // 3. Recommendation Logic
     let recommendedAllocation: RecommendedTable[] = [];
     
     // Combine Free Tables with their historical usage
     const candidateTables = freeTables.map(t => {
         const perf = tablePerformance.find(p => p.tableId === t.id);
         return {
             tableId: t.id,
             usage: perf ? perf.occupancyCount : 0
         };
     }).sort((a, b) => a.usage - b.usage); // Sort ASC (Lowest usage first)

     if (candidateTables.length > 0) {
        if (freeRatio > 0.8 && candidateTables.length >= 3) {
            // Special Rule: >80% Free. Mix Low and Medium usage.
            // Take 2 from the absolute bottom (Lowest)
            const lowUsage = candidateTables.slice(0, 2).map(c => ({
                tableId: c.tableId,
                reason: 'BAJO_USO' as const,
                usageCount: c.usage
            }));
            
            // Take 1 from the middle of the remaining candidates to balance rotation
            const remaining = candidateTables.slice(2);
            const midIndex = Math.floor(remaining.length / 2);
            const mediumUsage = remaining.length > 0 ? [{
                tableId: remaining[midIndex].tableId,
                reason: 'ROTACION_MEDIA' as const,
                usageCount: remaining[midIndex].usage
            }] : [];

            recommendedAllocation = [...lowUsage, ...mediumUsage];

        } else {
            // Standard Rule: Recommend the top 3 with lowest usage
            recommendedAllocation = candidateTables.slice(0, 3).map(c => ({
                tableId: c.tableId,
                reason: 'BAJO_USO' as const,
                usageCount: c.usage
            }));
        }
     }

     return {
         totalSessions: 1248,
         weeklySessions: [
             { day: 'Lun', count: 120 },
             { day: 'Mar', count: 155 },
             { day: 'Mié', count: 140 },
             { day: 'Jue', count: 195 },
             { day: 'Vie', count: 240 },
             { day: 'Sáb', count: 290 },
             { day: 'Dom', count: 180 },
         ],
         abandonedCartsRate: 12.5,
         conversionRate: 87.5,
         averageStayMinutes: 48,
         secondRoundRate: 34,
         occupancyRate,
         
         salesByWeather: [
            {condition: 'Soleado', customers: 145, revenue: 985000, ticket: 6793},
            {condition: 'Nublado', customers: 98, revenue: 620000, ticket: 6326},
            {condition: 'Lluvia', customers: 65, revenue: 510000, ticket: 7846},
            {condition: 'Frío', customers: 82, revenue: 590000, ticket: 7195}
         ],
         
         weeklySales: [
             { day: 'Lun', amount: 120000 },
             { day: 'Mar', amount: 145000 },
             { day: 'Mié', amount: 132000 },
             { day: 'Jue', amount: 190000 },
             { day: 'Vie', amount: 280000 },
             { day: 'Sáb', amount: 350000 },
             { day: 'Dom', amount: 210000 },
         ],

         // Data for Engagement Report (Conversion vs Abandonment vs Time)
         dailyEngagement: [
             { day: 'Lun', conversion: 78, abandonment: 22, avgTime: 45 },
             { day: 'Mar', conversion: 82, abandonment: 18, avgTime: 42 },
             { day: 'Mié', conversion: 80, abandonment: 20, avgTime: 48 },
             { day: 'Jue', conversion: 88, abandonment: 12, avgTime: 55 },
             { day: 'Vie', conversion: 92, abandonment: 8, avgTime: 65 },
             { day: 'Sáb', conversion: 85, abandonment: 15, avgTime: 70 },
             { day: 'Dom', conversion: 89, abandonment: 11, avgTime: 60 },
         ],

         popularProducts: [
             {name: 'BistrOS Burger', count: 420}, 
             {name: 'Cerveza IPA', count: 380},
             {name: 'Papas Rústicas', count: 215},
             {name: 'Limonada', count: 180},
             {name: 'Tiramisú', count: 95}
         ],
         
         deadProducts: [
             {name: 'Wrap Veggie', count: 12},
             {name: 'Agua s/gas', count: 8},
             {name: 'Ensalada', count: 3}
         ],

         tablePerformance,
         recommendedAllocation
     };
  }

  // --- WEBSOCKET MOCKS ---

  public subscribeToTable(tableId: string, cb: (table: Table) => void) {
    if (!this.tableListeners.has(tableId)) {
        this.tableListeners.set(tableId, []);
    }
    this.tableListeners.get(tableId)!.push(cb);
    cb(this.getTable(tableId));
    return () => {
        const list = this.tableListeners.get(tableId) || [];
        this.tableListeners.set(tableId, list.filter(l => l !== cb));
    };
  }

  public subscribeManager(cb: () => void) {
      this.managerListeners.push(cb);
      cb();
      return () => {
          this.managerListeners = this.managerListeners.filter(l => l !== cb);
      }
  }

  private notifyTable(tableId: string) {
      const listeners = this.tableListeners.get(tableId);
      if (listeners) {
          const t = this.getTable(tableId);
          listeners.forEach(cb => cb({ ...t }));
      }
  }

  private notifyManager() {
      this.managerListeners.forEach(cb => cb());
  }

  private seedTables() {
    this.tables.set('1', { id: '1', status: 'LIBRE', pendingReason: null, connectedDevices: 0, cart: [], currentOrderId: null, openedAt: null, lastEventAt: null });
    this.tables.set('2', { id: '2', status: 'ABIERTA', pendingReason: null, connectedDevices: 2, cart: [], currentOrderId: null, openedAt: Date.now() - 900000, lastEventAt: Date.now() - 120000 });
    
    const order3Id = 'ord-seed-3';
    const order3: Order = { id: order3Id, tableId: '3', items: [{ productId: 'mock_pizza', quantity: 1 }, { productId: 'mock_coca', quantity: 2 }], total: 8500, state: 'RECIBIDO', timestamps: { RECIBIDO: Date.now() - 300000, EN_PREPARACION: null, LISTO: null, EN_CAMINO: null, ENTREGADO: null }, createdAt: Date.now() - 300000 };
    this.orders.set(order3Id, order3);
    this.tables.set('3', { id: '3', status: 'PENDIENTE', pendingReason: 'PRODUCTOS', connectedDevices: 3, cart: [], currentOrderId: order3Id, openedAt: Date.now() - 2700000, lastEventAt: Date.now() - 300000 });

    const order4Id = 'ord-seed-4';
    const order4: Order = { id: order4Id, tableId: '4', items: [{ productId: 'mock_empanada', quantity: 3 }], total: 4500, state: 'ENTREGADO', timestamps: { RECIBIDO: Date.now() - 3600000, EN_PREPARACION: Date.now() - 3000000, LISTO: Date.now() - 2400000, EN_CAMINO: Date.now() - 2100000, ENTREGADO: Date.now() - 1800000 }, createdAt: Date.now() - 3600000 };
    this.orders.set(order4Id, order4);
    this.tables.set('4', { id: '4', status: 'OCUPADA', pendingReason: null, connectedDevices: 1, cart: [], currentOrderId: order4Id, openedAt: Date.now() - 4200000, lastEventAt: Date.now() - 1800000 });

    for (let i = 5; i <= 12; i++) {
        const id = i.toString();
        this.tables.set(id, { id, status: 'LIBRE', pendingReason: null, connectedDevices: 0, cart: [], currentOrderId: null, openedAt: null, lastEventAt: null });
    }
  }
}

export const backend = new BistrOSBackend();