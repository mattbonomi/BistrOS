import React from 'react';
import { Table, PendingReason, Order } from '../../types';
import { backend } from '../../services/mockBackend';
import { Users, Clock, AlertCircle, Utensils, FileText, CheckCircle, DollarSign, Archive } from 'lucide-react';
import { MENU_ITEMS } from '../../constants';

interface TableBoardProps {
    tables: Table[];
}

// Sub-component for rendering the order details inside a pending/occupied card
const MiniOrderView: React.FC<{ orderId: string }> = ({ orderId }) => {
    const order = backend.getOrder(orderId);
    if (!order) return null;

    return (
        <div className="mt-2 text-xs bg-white/60 p-2 rounded border border-black/5">
            {order.items.map((item, idx) => {
                const prod = MENU_ITEMS.find(p => p.id === item.productId);
                return (
                    <div key={idx} className="flex justify-between">
                        <span>{item.quantity}x {prod?.name}</span>
                    </div>
                );
            })}
            <div className="mt-1 font-bold pt-1 border-t border-black/10">
                Total: ${order.total.toLocaleString()}
            </div>
        </div>
    );
};

export const TableBoard: React.FC<TableBoardProps> = ({ tables }) => {
    
    // Actions
    const markPreparation = (orderId: string | null) => {
        if(orderId) backend.setOrderState(orderId, 'EN_PREPARACION');
    };

    const attendWaiter = (tableId: string) => backend.attendWaiter(tableId);
    const deliverBill = (tableId: string) => backend.deliverBill(tableId);
    const closeTable = (tableId: string) => backend.closeTable(tableId);

    // Helpers for card styling based on state
    const getCardStyle = (table: Table) => {
        switch (table.status) {
            case 'LIBRE': 
                // Color: neutro (gris suave o transparente, sin llamar la atención)
                return 'bg-gray-50 border-gray-100 text-gray-400 opacity-70 hover:opacity-100';
            case 'ABIERTA': 
                // Color: azul suave (gente mirando, no urgente)
                return 'bg-blue-50 border-blue-200 text-blue-900';
            case 'PENDIENTE': 
                // Color: rojo fuerte (CRÍTICO: necesita acción YA)
                return 'bg-red-50 border-red-500 text-red-900 ring-1 ring-red-400 shadow-md';
            case 'OCUPADA': 
                // Color: verde (SALUDABLE: consumiendo/atendida)
                return 'bg-green-50 border-green-300 text-green-900';
            case 'PAGADA':
                // Color: violeta (FINALIZADA: lista para archivar)
                return 'bg-purple-50 border-purple-300 text-purple-900';
            default: 
                return 'bg-white';
        }
    };

    const formatTime = (ts: number | null) => {
        if (!ts) return '';
        const diff = Math.floor((Date.now() - ts) / 60000);
        return `${diff} min`;
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map(table => (
                <div key={table.id} className={`border-2 rounded-xl p-4 flex flex-col justify-between min-h-[200px] shadow-sm relative transition-all duration-300 ${getCardStyle(table)}`}>
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl font-bold">#{table.id}</span>
                        {table.status !== 'LIBRE' && (
                             <div className="flex items-center space-x-1 text-xs font-mono bg-white/60 px-2 py-1 rounded">
                                <Users size={12} />
                                <span>{table.connectedDevices}</span>
                            </div>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1">
                        <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                            {table.status}
                        </div>

                        {/* ABIERTA */}
                        {table.status === 'ABIERTA' && (
                            <div className="text-sm opacity-80">
                                Escaneado hace {formatTime(table.openedAt)}
                            </div>
                        )}

                        {/* PENDIENTE */}
                        {table.status === 'PENDIENTE' && (
                            <div className="animate-pulse-slow">
                                <div className="flex items-center font-bold text-red-700 mb-2">
                                    <AlertCircle size={16} className="mr-1" />
                                    {table.pendingReason === 'PRODUCTOS' && 'PEDIDO NUEVO'}
                                    {table.pendingReason === 'CAMARERO' && 'LLAMA CAMARERO'}
                                    {table.pendingReason === 'CUENTA' && 'PIDE CUENTA'}
                                </div>
                                <div className="text-xs flex items-center mb-2 font-medium">
                                    <Clock size={12} className="mr-1" />
                                    Hace {formatTime(table.lastEventAt)}
                                </div>

                                {table.pendingReason === 'PRODUCTOS' && table.currentOrderId && (
                                    <MiniOrderView orderId={table.currentOrderId} />
                                )}
                            </div>
                        )}

                        {/* OCUPADA */}
                        {table.status === 'OCUPADA' && (
                            <div>
                                <div className="text-sm mb-2 font-medium">En servicio (Saludable)</div>
                                {table.currentOrderId && <MiniOrderView orderId={table.currentOrderId} />}
                            </div>
                        )}

                         {/* PAGADA */}
                         {table.status === 'PAGADA' && (
                            <div>
                                <div className="flex items-center text-sm font-bold text-purple-700 mb-2">
                                    <CheckCircle size={16} className="mr-1"/> Pago Confirmado
                                </div>
                                <div className="text-xs opacity-70">Listo para liberar mesa.</div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                        
                        {/* PENDIENTE ACTIONS */}
                        {table.status === 'PENDIENTE' && table.pendingReason === 'PRODUCTOS' && (
                            <button 
                                onClick={() => markPreparation(table.currentOrderId)}
                                className="w-full bg-red-600 text-white py-2 rounded font-bold text-sm hover:bg-red-700 shadow-sm"
                            >
                                MARCAR EN PREPARACIÓN
                            </button>
                        )}
                        {table.status === 'PENDIENTE' && table.pendingReason === 'CAMARERO' && (
                            <button 
                                onClick={() => attendWaiter(table.id)}
                                className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 shadow-sm"
                            >
                                ATENDER
                            </button>
                        )}
                        {table.status === 'PENDIENTE' && table.pendingReason === 'CUENTA' && (
                            <button 
                                onClick={() => deliverBill(table.id)}
                                className="w-full bg-green-600 text-white py-2 rounded font-bold text-sm hover:bg-green-700 shadow-sm"
                            >
                                LLEVAR CUENTA
                            </button>
                        )}

                        {/* OCUPADA ACTIONS */}
                        {table.status === 'OCUPADA' && (
                            <button 
                                onClick={() => closeTable(table.id)}
                                className="w-full bg-white border-2 border-green-600 text-green-700 py-2 rounded font-bold text-sm hover:bg-green-50 flex items-center justify-center transition-colors"
                            >
                                <DollarSign size={16} className="mr-1" /> COBRAR Y LIBERAR
                            </button>
                        )}
                        
                        {/* PAGADA ACTIONS */}
                        {table.status === 'PAGADA' && (
                             <button 
                                onClick={() => closeTable(table.id)}
                                className="w-full bg-purple-600 text-white py-2 rounded font-bold text-sm hover:bg-purple-700 flex items-center justify-center shadow-sm"
                            >
                                <Archive size={16} className="mr-2" /> LIBERAR MESA
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};