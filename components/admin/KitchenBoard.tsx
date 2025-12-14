import React from 'react';
import { backend } from '../../services/mockBackend';
import { Order, OrderState } from '../../types';
import { MENU_ITEMS } from '../../constants';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';

export const KitchenBoard: React.FC = () => {
    const orders = backend.getAllOrders().filter(o => o.state !== 'ENTREGADO'); // Show active orders

    const updateState = (orderId: string, newState: OrderState) => {
        backend.setOrderState(orderId, newState);
    };

    if (orders.length === 0) {
        return <div className="p-10 text-center text-gray-500">No hay pedidos en cola.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 flex flex-col">
                    <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="font-bold text-lg">Mesa {order.tableId}</span>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{order.state}</span>
                    </div>

                    <div className="flex-1 space-y-1 mb-4">
                        {order.items.map((item, idx) => {
                             const p = MENU_ITEMS.find(x => x.id === item.productId);
                             return (
                                 <div key={idx} className="flex justify-between text-sm">
                                     <span className="font-medium text-gray-800">{item.quantity}x {p?.name}</span>
                                 </div>
                             );
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-400 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {Math.floor((Date.now() - order.createdAt) / 60000)} min
                        </div>
                        
                        <div className="flex space-x-2">
                            {order.state === 'RECIBIDO' && (
                                <button onClick={() => updateState(order.id, 'EN_PREPARACION')} className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">Preparar</button>
                            )}
                            {order.state === 'EN_PREPARACION' && (
                                <button onClick={() => updateState(order.id, 'LISTO')} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Listo</button>
                            )}
                            {order.state === 'LISTO' && (
                                <button onClick={() => updateState(order.id, 'EN_CAMINO')} className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">Llevar</button>
                            )}
                            {order.state === 'EN_CAMINO' && (
                                <button onClick={() => updateState(order.id, 'ENTREGADO')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center">
                                    <CheckCircle size={14} className="mr-1"/> Entregado
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
