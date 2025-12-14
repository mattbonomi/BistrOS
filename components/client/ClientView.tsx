import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { backend } from '../../services/mockBackend';
import { MENU_ITEMS } from '../../constants';
import { Table, Order } from '../../types';
import { ProductCard } from './ProductCard';
import { ShoppingBag, Loader2, Bell, Receipt, Users, X, CreditCard, Banknote, Smartphone, ChevronRight, ExternalLink, Store, QrCode, CheckCircle2, ChevronLeft, ArrowRight, Copy, Check } from 'lucide-react';

// --- CONSTANTS ---
const MP_ALIAS = "BISTROS.PAGO.MP";
const MP_LINK = "https://link.mercadopago.com.ar/mattuniverse";

// --- TICKET MODAL COMPONENT ---
type ModalStep = 'TICKET' | 'CATEGORY_SELECT' | 'ONLINE_SELECT' | 'PHYSICAL_SELECT' | 'CONFIRMATION';
type ActionType = 'OPEN_MP' | 'OPEN_LINK' | 'COPY_ALIAS' | 'NONE';

interface BillModalProps {
    tableId: string;
    orders: Order[];
    onClose: () => void;
    onPay: (method: string, total: number) => void;
}

const BillModal: React.FC<BillModalProps> = ({ tableId, orders, onClose, onPay }) => {
    const [step, setStep] = useState<ModalStep>('TICKET');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    
    // Logic for 2-step payment
    const [actionConfig, setActionConfig] = useState<{type: ActionType, payload?: string}>({ type: 'NONE' });
    const [hasExecutedAction, setHasExecutedAction] = useState(false);
    
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Flatten and group items for display
    const allItems = useMemo(() => orders.flatMap(o => o.items), [orders]);
    const groupedItems = useMemo(() => allItems.reduce((acc, item) => {
        const existing = acc.find(i => i.productId === item.productId);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            acc.push({ ...item });
        }
        return acc;
    }, [] as {productId: string, quantity: number}[]), [allItems]);

    // Calculate total from the grouped items to ensure it matches the displayed list exactly
    const total = useMemo(() => groupedItems.reduce((acc, item) => {
        const p = MENU_ITEMS.find(x => x.id === item.productId);
        return acc + (p ? p.price * item.quantity : 0);
    }, 0), [groupedItems]);

    // -- LOGIC HELPERS --
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(text);
            setTimeout(() => setCopySuccess(null), 3000);
        });
    };

    // Step 1: Just Select Method and Config, don't execute yet
    const handleSelectMethod = (method: string, type: ActionType) => {
        setSelectedMethod(method);
        setActionConfig({ type });
        setHasExecutedAction(false); // Reset status
        setStep('CONFIRMATION');
    };

    // Step 2: User clicks "Realizar Pago" inside Confirmation
    const executePaymentAction = () => {
        if (actionConfig.type === 'COPY_ALIAS') {
            handleCopy(MP_ALIAS);
        } else if (actionConfig.type === 'OPEN_MP') {
            handleCopy(MP_ALIAS); 
            setTimeout(() => {
                alert("Abriendo Mercado Pago...");
                window.open("https://www.mercadopago.com.ar", "_blank");
            }, 500);
        } else if (actionConfig.type === 'OPEN_LINK') {
            handleCopy(total.toString());
            window.open(MP_LINK, "_blank");
        }
        
        // Change UI state to allow final confirmation
        setHasExecutedAction(true);
    };

    // -- RENDERERS --

    const renderTicket = () => (
        <>
             <div className="space-y-3 mb-6">
                {groupedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Aún no has pedido nada.</div>
                ) : (
                    groupedItems.map((item, idx) => {
                        const p = MENU_ITEMS.find(x => x.id === item.productId);
                        return (
                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed border-gray-100 last:border-0">
                                <div className="flex items-center">
                                    <span className="font-bold w-6 text-gray-900">{item.quantity}x</span>
                                    <span className="text-gray-700">{p?.name || 'Producto'}</span>
                                </div>
                                <span className="font-medium text-gray-900">${((p?.price || 0) * item.quantity).toLocaleString()}</span>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Always show total if there are items */}
            {groupedItems.length > 0 && (
                <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">TOTAL</span>
                    <span className="text-2xl font-black text-gray-900">${total.toLocaleString()}</span>
                </div>
            )}
            <div className="mt-8">
                 <button 
                    disabled={groupedItems.length === 0}
                    onClick={() => setStep('CATEGORY_SELECT')}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    PAGAR <ChevronRight size={20} className="ml-2" />
                </button>
            </div>
        </>
    );

    const renderCategorySelect = () => (
        <div className="space-y-4">
             <button onClick={() => setStep('ONLINE_SELECT')} className="w-full p-6 border-2 border-blue-50 bg-blue-50/30 rounded-2xl hover:border-blue-200 hover:bg-blue-50 transition-all flex flex-col items-center">
                 <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-3">
                     <Smartphone size={32} />
                 </div>
                 <span className="font-bold text-lg text-gray-900">Pago Online</span>
                 <span className="text-sm text-gray-500 text-center mt-1">Mercado Pago, Transferencia, Tarjeta (Link)</span>
             </button>

             <button onClick={() => setStep('PHYSICAL_SELECT')} className="w-full p-6 border-2 border-gray-50 bg-gray-50/30 rounded-2xl hover:border-gray-200 hover:bg-gray-50 transition-all flex flex-col items-center">
                 <div className="bg-gray-100 p-4 rounded-full text-gray-600 mb-3">
                     <Store size={32} />
                 </div>
                 <span className="font-bold text-lg text-gray-900">Pago Físico</span>
                 <span className="text-sm text-gray-500 text-center mt-1">Efectivo, Tarjeta en mesa, QR Local</span>
             </button>
        </div>
    );

    const renderOnlineSelect = () => (
        <div className="space-y-3">
             {/* Mercado Pago */}
             <button onClick={() => handleSelectMethod('Transferencia MP', 'OPEN_MP')} className="w-full p-4 border rounded-xl flex items-start text-left hover:bg-gray-50">
                 <div className="bg-sky-100 p-2 rounded-full mr-3 text-sky-600 mt-1"><Smartphone size={20} /></div>
                 <div>
                     <div className="font-bold text-gray-900">Mercado Pago</div>
                     <div className="text-xs text-gray-500 mt-1">Abrir app y copiar alias.</div>
                 </div>
                 <ChevronRight className="ml-auto text-gray-300 mt-2" size={18} />
             </button>

             {/* Otros Bancos */}
             <button onClick={() => handleSelectMethod('Transferencia Bancaria', 'COPY_ALIAS')} className="w-full p-4 border rounded-xl flex items-start text-left hover:bg-gray-50">
                 <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600 mt-1"><Banknote size={20} /></div>
                 <div>
                     <div className="font-bold text-gray-900">Otros Bancos</div>
                     <div className="text-xs text-gray-500 mt-1">Copiar alias para Home Banking.</div>
                 </div>
                 <ChevronRight className="ml-auto text-gray-300 mt-2" size={18} />
             </button>

             {/* Tarjeta Link */}
             <button onClick={() => handleSelectMethod('Tarjeta Online', 'OPEN_LINK')} className="w-full p-4 border rounded-xl flex items-start text-left hover:bg-gray-50">
                 <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600 mt-1"><CreditCard size={20} /></div>
                 <div>
                     <div className="font-bold text-gray-900">Tarjeta (Link de Pago)</div>
                     <div className="text-xs text-gray-500 mt-1">Abrir link seguro de cobro.</div>
                 </div>
                 <ExternalLink className="ml-auto text-gray-400 mt-2" size={16} />
             </button>
        </div>
    );

    const renderPhysicalSelect = () => (
        <div className="space-y-3">
             <button onClick={() => handleSelectMethod('Efectivo', 'NONE')} className="w-full p-4 border rounded-xl flex items-center text-left hover:bg-gray-50">
                 <div className="bg-green-100 p-2 rounded-full mr-3 text-green-700"><Banknote size={20} /></div>
                 <span className="font-bold text-gray-900">Efectivo</span>
             </button>
             <button onClick={() => handleSelectMethod('Tarjeta Física', 'NONE')} className="w-full p-4 border rounded-xl flex items-center text-left hover:bg-gray-50">
                 <div className="bg-gray-100 p-2 rounded-full mr-3 text-gray-700"><CreditCard size={20} /></div>
                 <span className="font-bold text-gray-900">Tarjeta (Crédito/Débito)</span>
             </button>
             <button onClick={() => handleSelectMethod('QR Local', 'NONE')} className="w-full p-4 border rounded-xl flex items-center text-left hover:bg-gray-50">
                 <div className="bg-black/10 p-2 rounded-full mr-3 text-black"><QrCode size={20} /></div>
                 <span className="font-bold text-gray-900">QR del Local</span>
             </button>
        </div>
    );

    const renderConfirmation = () => {
        const isActionable = actionConfig.type !== 'NONE';
        const showSuccessState = hasExecutedAction || !isActionable;
        const tipAmount = total * 0.1;

        return (
            <div className="text-center">
                <div className="mb-6">
                    <div className="text-gray-500 text-sm mb-1">Método Seleccionado</div>
                    <div className="font-bold text-xl text-gray-900 flex justify-center items-center">
                        {selectedMethod}
                        <CheckCircle2 size={20} className="text-green-500 ml-2" />
                    </div>
                </div>

                {/* Show Instructions or Success Banner based on state */}
                {isActionable && !hasExecutedAction && (
                    <div className="bg-gray-50 text-gray-600 p-4 rounded-lg text-sm mb-6 border border-gray-100">
                        Hacé clic en <strong>Realizar Pago</strong> para 
                        {actionConfig.type === 'OPEN_MP' && ' abrir Mercado Pago.'}
                        {actionConfig.type === 'COPY_ALIAS' && ' copiar el Alias.'}
                        {actionConfig.type === 'OPEN_LINK' && ' ir al link de pago.'}
                    </div>
                )}

                {hasExecutedAction && actionConfig.type === 'COPY_ALIAS' && (
                     <div className="bg-purple-50 text-purple-800 p-3 rounded-lg text-sm mb-6 animate-in fade-in">
                        ✅ Alias copiado. Hacé la transferencia y confirma abajo.
                    </div>
                )}
                 {hasExecutedAction && actionConfig.type === 'OPEN_MP' && (
                     <div className="bg-sky-50 text-sky-800 p-3 rounded-lg text-sm mb-6 animate-in fade-in">
                        ✅ Alias copiado. Si ya pagaste en la App, confirma abajo.
                    </div>
                )}
                {hasExecutedAction && actionConfig.type === 'OPEN_LINK' && (
                     <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-6 animate-in fade-in">
                        ✅ Link abierto. Si ya completaste el pago, confirma abajo.
                    </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total</span>
                        <span className="font-medium text-gray-900">${total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                        <span className="text-gray-600">Propina (Sugerido 10%)</span>
                        <div className="text-right">
                            <span className="font-medium text-gray-500">${tipAmount.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 italic ml-1">(No incluido)</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total a Pagar</span>
                        <span className="text-2xl font-black text-gray-900">${total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* BUTTON 1: Perform Action (Only if Online and not done yet) */}
                    {isActionable && !hasExecutedAction && (
                        <button 
                            onClick={executePaymentAction}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 shadow-lg transition-all active:scale-95 flex items-center justify-center"
                        >
                            {actionConfig.type === 'COPY_ALIAS' && <Copy className="mr-2" size={20} />}
                            {actionConfig.type === 'OPEN_MP' && <Smartphone className="mr-2" size={20} />}
                            {actionConfig.type === 'OPEN_LINK' && <ExternalLink className="mr-2" size={20} />}
                            REALIZAR PAGO
                        </button>
                    )}

                    {/* BUTTON 2: Finalize (Only if action done or method is physical) */}
                    {showSuccessState && (
                        <button 
                            onClick={() => onPay(selectedMethod, total)}
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 animate-in slide-in-from-bottom-2 fade-in"
                        >
                            CONFIRMAR PAGO REALIZADO
                        </button>
                    )}
                    
                    {/* Back button logic adjustment */}
                    {hasExecutedAction && (
                         <button 
                         onClick={() => setHasExecutedAction(false)}
                         className="w-full py-3 text-gray-500 font-medium text-sm hover:text-gray-800"
                     >
                         Volver a instrucciones
                     </button>
                    )}
                </div>
            </div>
        );
    };

    // -- MAIN RENDER --
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header with Back Button */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center">
                         {step !== 'TICKET' && (
                             <button onClick={() => {
                                 if (step === 'CONFIRMATION') {
                                     if (hasExecutedAction) {
                                         // If executed, warn or reset? Let's just reset action state first?
                                         // For simplicity, go back to selection
                                         setHasExecutedAction(false);
                                         setStep('ONLINE_SELECT'); // Assuming online since physical doesn't have "execution" state usually
                                     } else {
                                         // Go back to list
                                         setStep(actionConfig.type === 'NONE' ? 'PHYSICAL_SELECT' : 'ONLINE_SELECT');
                                     }
                                 } 
                                 else if (step === 'ONLINE_SELECT' || step === 'PHYSICAL_SELECT') setStep('CATEGORY_SELECT');
                                 else setStep('TICKET');
                             }} className="mr-3 p-1 rounded-full hover:bg-gray-100 text-gray-500">
                                 <ChevronLeft size={24} />
                             </button>
                         )}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {step === 'TICKET' && 'Tu Cuenta'}
                                {(step === 'CATEGORY_SELECT' || step === 'ONLINE_SELECT' || step === 'PHYSICAL_SELECT') && '¿Cómo vas a pagar?'}
                                {step === 'CONFIRMATION' && 'Confirmar Pago'}
                            </h2>
                            {step === 'TICKET' && <p className="text-xs text-gray-500">Mesa {tableId}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'TICKET' && renderTicket()}
                    {step === 'CATEGORY_SELECT' && renderCategorySelect()}
                    {step === 'ONLINE_SELECT' && renderOnlineSelect()}
                    {step === 'PHYSICAL_SELECT' && renderPhysicalSelect()}
                    {step === 'CONFIRMATION' && renderConfirmation()}
                </div>

                {/* Toast Notification for Clipboard */}
                {copySuccess && (
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-2 z-50">
                        Copiado: {copySuccess}
                    </div>
                )}
            </div>
        </div>
    );
};

export const ClientView: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<Table | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Notification States
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const lastOrderStateRef = useRef<string | null>(null);

  // Modal State
  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    if (!tableId) {
      navigate('/');
      return;
    }
    // 1. Scan QR / Connect
    backend.scanQR(tableId);

    // 2. Subscribe
    const unsubscribe = backend.subscribeToTable(tableId, (updatedTable) => {
      setTable(updatedTable);
    });
    
    return () => unsubscribe();
  }, [tableId, navigate]);

  // Track latest order status for Notifications (Popup & Banner)
  const allOrders = useMemo(() => tableId ? backend.getTableOrders(tableId) : [], [tableId, table]); // Dependency on table is crucial for updates
  const latestOrder = allOrders.length > 0 ? allOrders[allOrders.length - 1] : null;

  useEffect(() => {
    if (latestOrder) {
        // Check for state transitions
        if (lastOrderStateRef.current !== latestOrder.state) {
            // Transition logic
            if (latestOrder.state === 'RECIBIDO') {
                // Just placed
                setPopupMessage('Pedido enviado');
                setTimeout(() => setPopupMessage(null), 1000);
            } else if (latestOrder.state === 'EN_PREPARACION') {
                // Confirmed by manager
                setPopupMessage('Pedido recibido');
                setTimeout(() => setPopupMessage(null), 1000);
            }
            
            lastOrderStateRef.current = latestOrder.state;
        }
    } else {
        lastOrderStateRef.current = null;
    }
  }, [latestOrder]);


  const handleUpdateCart = (productId: string, delta: number) => {
    if (tableId) backend.updateCart(tableId, productId, delta);
  };

  const handlePlaceOrder = () => {
    if (!tableId) return;
    setIsOrdering(true);
    setTimeout(() => {
      backend.placeOrder(tableId);
      setIsOrdering(false);
    }, 1000);
  };

  const handleRequestWaiter = () => {
    if (tableId && confirm('¿Llamar al camarero?')) {
        backend.requestWaiter(tableId);
    }
  };

  const handleOpenBill = () => {
      setShowBillModal(true);
  };

  const handleProcessPayment = (method: string, total: number) => {
    if (tableId) {
        backend.payTable(tableId, method, total);
        setShowBillModal(false);
        alert("¡Pago registrado! Gracias por tu visita.");
        // Optional: Redirect home or show a specific "Paid" screen
        navigate('/');
    }
  };

  // --- RENDER HELPERS ---

  const getQuantity = (productId: string) => {
    return table?.cart.find(i => i.productId === productId)?.quantity || 0;
  };

  const totalAmount = useMemo(() => {
    if (!table) return 0;
    return table.cart.reduce((acc, item) => {
      const product = MENU_ITEMS.find(p => p.id === item.productId);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [table]);

  const cartItemCount = table?.cart.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Banner Logic
  const getBannerContent = () => {
      if (!table) return null;
      
      // High priority: Waiter/Bill
      if (table.pendingReason === 'CAMARERO') return { text: '👋 Camarero solicitado.', colorClass: 'bg-orange-100 text-orange-800' };
      if (table.pendingReason === 'CUENTA') return { text: '📄 Cuenta solicitada.', colorClass: 'bg-orange-100 text-orange-800' };
      if (table.status === 'PAGADA') return { text: '✅ Mesa Pagada. ¡Gracias!', colorClass: 'bg-green-100 text-green-800' };

      // Order Status Banner
      if (latestOrder) {
          if (latestOrder.state === 'RECIBIDO') {
              return { text: 'Pedido enviado', colorClass: 'bg-blue-100 text-blue-800' };
          }
          if (latestOrder.state !== 'RECIBIDO') { // EN_PREPARACION, LISTO, etc.
              return { text: 'Pedido recibido', colorClass: 'bg-green-100 text-green-800' };
          }
      }
      return null;
  };

  const banner = getBannerContent();


  if (!table) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // If table is LIBRE or PAGADA (closed for client)
  if ((table.status === 'LIBRE' || table.status === 'PAGADA') && table.connectedDevices === 0) {
     return <div className="p-10 text-center">Mesa cerrada. Escanea el QR nuevamente.</div>;
  }

  return (
    <div className="pb-32 bg-gray-50 min-h-screen relative">
      
      {/* Central Popup Notification */}
      {popupMessage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md text-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                  <div className="bg-white/20 p-3 rounded-full mb-3">
                    <Check size={32} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="text-xl font-bold tracking-wide">{popupMessage}</span>
              </div>
          </div>
      )}

      {/* Bill Modal */}
      {showBillModal && tableId && (
          <BillModal 
            tableId={tableId}
            orders={allOrders}
            onClose={() => setShowBillModal(false)} 
            onPay={handleProcessPayment} 
          />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">BistrOS</h1>
            <p className="text-xs text-gray-500">Mesa {table.id}</p>
        </div>
        <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                <Users className="w-3 h-3 mr-1" /> {table.connectedDevices}
            </div>
        </div>
      </header>

      {/* State Banner */}
      {banner && (
          <div className={`${banner.colorClass} px-4 py-2 text-sm text-center font-bold tracking-wide transition-colors duration-300`}>
              {banner.text}
          </div>
      )}

      {/* Menu */}
      <main className="max-w-2xl mx-auto pt-2">
        <div className="divide-y divide-gray-100">
          {MENU_ITEMS.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              quantity={getQuantity(product.id)}
              onUpdate={(delta) => handleUpdateCart(product.id, delta)}
            />
          ))}
        </div>
      </main>

      {/* Actions Footer */}
      {table.status !== 'PAGADA' && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg pb-safe">
        
        {/* Cart Summary */}
        {cartItemCount > 0 ? (
           <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">{cartItemCount} items</span>
                    <span className="font-bold text-xl">${totalAmount.toLocaleString()}</span>
                </div>
                <button
                    disabled={isOrdering}
                    onClick={handlePlaceOrder}
                    className="w-full bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                >
                    {isOrdering ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
                    <span>HACER PEDIDO</span>
                </button>
           </div>
        ) : (
            <div className="grid grid-cols-2 gap-px bg-gray-200">
                <button 
                    onClick={handleRequestWaiter}
                    className="bg-white p-4 flex flex-col items-center justify-center active:bg-gray-50"
                >
                    <Bell className="mb-1 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600">CAMARERO</span>
                </button>
                <button 
                    onClick={handleOpenBill}
                    className="bg-white p-4 flex flex-col items-center justify-center active:bg-gray-50"
                >
                    <Receipt className="mb-1 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600">CUENTA/PAGAR</span>
                </button>
            </div>
        )}
      </div>
      )}
    </div>
  );
}