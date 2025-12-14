import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, LayoutDashboard, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [tableInput, setTableInput] = useState('');

  const enterTable = (e: React.FormEvent) => {
    e.preventDefault();
    if(tableInput.trim()) navigate(`/table/${tableInput}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6 font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Intro Section */}
        <div className="flex flex-col justify-center text-white space-y-6">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-2">BistrOS</h1>
            <p className="text-slate-400 text-lg">Sistema Operativo Gastronómico</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 opacity-80">
                <QrCode className="mt-1" />
                <p className="text-sm">Escanea (simula) el QR de la mesa para entrar al menú colaborativo.</p>
            </div>
             <div className="flex items-start space-x-3 opacity-80">
                <LayoutDashboard className="mt-1" />
                <p className="text-sm">Controla métricas y mesas desde el panel de gerente.</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          
          {/* Card: Cliente */}
          <div className="bg-white rounded-2xl p-6 shadow-xl transform transition-all hover:scale-[1.02]">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <QrCode className="mr-2 text-blue-600" />
              Soy Cliente
            </h2>
            <form onSubmit={enterTable} className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Simular escaneo de QR
              </label>
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  placeholder="N° Mesa (ej: 5)" 
                  className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  autoFocus
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center"
                >
                  Entrar <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
            </form>
          </div>

          {/* Card: Gerente */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between group cursor-pointer hover:bg-slate-750" onClick={() => navigate('/admin')}>
            <div>
              <h2 className="text-xl font-bold text-white mb-1 flex items-center">
                <LayoutDashboard className="mr-2 text-emerald-500" />
                Soy Gerente
              </h2>
              <p className="text-sm text-slate-400">Acceso al Dashboard</p>
            </div>
            <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-slate-600 transition-colors">
              <ArrowRight className="text-white" size={20} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};