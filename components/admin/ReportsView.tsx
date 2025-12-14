import React, { useEffect, useState } from 'react';
import { backend } from '../../services/mockBackend';
import { DashboardMetrics } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, ComposedChart, Line, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, AlertTriangle, CloudSun, CalendarDays, Activity, Layout, Trophy, Sparkles, UserPlus, FileSpreadsheet } from 'lucide-react';

// Tiny chart component for KPI cards
const Sparkline = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => (
    <div className="h-12 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

// Helper to download data as CSV (Google Sheets Compatible)
const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(',')) // Data rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const ExportButton = ({ data, filename }: { data: any[], filename: string }) => (
    <button 
        onClick={() => exportToCSV(data, filename)} 
        className="flex items-center text-xs text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded transition-colors"
        title="Descargar CSV para Google Sheets"
    >
        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
        Exportar G-Sheets
    </button>
);

export const ReportsView: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    setMetrics(backend.getDashboardMetrics());
    const i = setInterval(() => setMetrics(backend.getDashboardMetrics()), 10000);
    return () => clearInterval(i);
  }, []);

  if (!metrics) return <div className="p-8 text-center text-gray-500">Cargando métricas del sistema...</div>;

  // Sort tables by usage for the ranking list
  const sortedByUsage = [...metrics.tablePerformance].sort((a, b) => b.occupancyCount - a.occupancyCount);
  const maxUsage = sortedByUsage[0]?.occupancyCount || 1;

  return (
    <div className="space-y-6 pb-10">
        
        {/* Recommendation Banner */}
        {metrics.recommendedAllocation.length > 0 && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center">
                            <Sparkles className="mr-2 text-yellow-300 animate-pulse" />
                            Recomendación de Asignación Inteligente
                        </h3>
                        <p className="text-indigo-100 mt-1 max-w-2xl text-sm">
                            Algoritmo de balanceo de carga: Basado en disponibilidad actual y desgaste histórico.
                        </p>
                    </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {metrics.recommendedAllocation.map((rec, idx) => (
                        <div key={rec.tableId} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors cursor-pointer">
                            <div className="flex items-center">
                                <div className="bg-white text-indigo-700 font-black h-10 w-10 flex items-center justify-center rounded-full text-lg mr-3 shadow-sm">
                                    {rec.tableId}
                                </div>
                                <div>
                                    <div className="font-bold text-sm uppercase tracking-wide">Mesa Sugerida</div>
                                    <div className="text-xs text-indigo-200 flex items-center mt-0.5">
                                        {rec.reason === 'BAJO_USO' ? (
                                            <span className="flex items-center"><Trophy size={10} className="mr-1"/> Menos Usada ({rec.usageCount})</span>
                                        ) : (
                                            <span className="flex items-center"><Activity size={10} className="mr-1"/> Rotación Media ({rec.usageCount})</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <UserPlus className="text-white/80" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Standard KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Sesiones</span>
                        <Users className="text-blue-500 h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.totalSessions.toLocaleString()}</div>
                    <div className="text-xs text-green-500 mt-1 font-medium">+{metrics.secondRoundRate}% recompra</div>
                </div>
                <Sparkline data={metrics.weeklySessions} dataKey="count" color="#3b82f6" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Conversión</span>
                        <TrendingUp className="text-green-500 h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.conversionRate}%</div>
                    <div className="text-xs text-gray-400 mt-1">Visitantes a Pagos</div>
                </div>
                <Sparkline data={metrics.dailyEngagement} dataKey="conversion" color="#22c55e" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Abandono</span>
                        <AlertTriangle className="text-red-500 h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.abandonedCartsRate}%</div>
                    <div className="text-xs text-gray-400 mt-1">Carritos sin cerrar</div>
                </div>
                <Sparkline data={metrics.dailyEngagement} dataKey="abandonment" color="#ef4444" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Tiempo Prom.</span>
                        <Clock className="text-purple-500 h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.averageStayMinutes} min</div>
                    <div className="text-xs text-gray-400 mt-1">Por mesa ocupada</div>
                </div>
                <Sparkline data={metrics.dailyEngagement} dataKey="avgTime" color="#a855f7" />
            </div>
        </div>

        {/* SECTION: Table Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table Revenue Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        <Layout className="mr-2 h-5 w-5 text-indigo-500" />
                        Facturación por Mesa
                    </h3>
                    <ExportButton data={metrics.tablePerformance} filename="facturacion_por_mesa" />
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.tablePerformance} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="tableId" type="category" width={40} tickFormatter={(val) => `M${val}`} tick={{fontSize: 12, fill: '#6b7280'}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                            />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20} fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ranking Histórico de Uso */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="font-semibold text-gray-800 flex items-center">
                        <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                        Ranking Histórico
                    </h3>
                    <ExportButton data={sortedByUsage.map(t => ({...t, ranking: sortedByUsage.indexOf(t)+1}))} filename="ranking_uso_mesas" />
                </div>
               
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-4">
                        {sortedByUsage.map((table, index) => (
                            <div key={table.tableId} className="flex items-center justify-between group">
                                <div className="flex items-center flex-1">
                                    <span className={`font-bold mr-3 w-6 text-center text-sm ${index < 3 ? 'text-yellow-600 bg-yellow-50 rounded' : 'text-gray-400'}`}>
                                        #{index + 1}
                                    </span>
                                    <span className="font-medium text-gray-700">Mesa {table.tableId}</span>
                                </div>
                                
                                <div className="flex items-center flex-1 justify-end">
                                    {/* Visual Bar for Usage */}
                                    <div className="w-24 h-2 bg-gray-100 rounded-full mr-3 hidden sm:block overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${index === 0 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${(table.occupancyCount / maxUsage) * 100}%` }}
                                        />
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                                        {table.occupancyCount} usos
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="text-center text-xs text-gray-400 mt-4 pt-2 border-t">
                    * Ordenado por frecuencia histórica total
                </div>
            </div>
        </div>

        {/* Charts Row: Engagement History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-emerald-500" />
                    Engagement Semanal (Conversión vs Abandono)
                </h3>
                <ExportButton data={metrics.dailyEngagement} filename="engagement_semanal" />
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={metrics.dailyEngagement}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <YAxis yAxisId="left" orientation="left" hide domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" hide domain={[0, 120]} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}/>
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="conversion" name="Tasa Conversión (%)" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} />
                        <Line yAxisId="left" type="monotone" dataKey="abandonment" name="Tasa Abandono (%)" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                        <Line yAxisId="right" type="monotone" dataKey="avgTime" name="Tiempo Promedio (min)" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4}} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        {/* Charts Row: Sales & Weather */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        <CalendarDays className="mr-2 h-5 w-5 text-indigo-500" />
                        Historial de Ventas
                    </h3>
                    <ExportButton data={metrics.weeklySales} filename="historial_ventas" />
                </div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.weeklySales}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(val: number) => `$${val.toLocaleString()}`}/>
                            <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        <CloudSun className="mr-2 h-5 w-5 text-orange-500" />
                        Impacto del Clima
                    </h3>
                    <ExportButton data={metrics.salesByWeather} filename="analisis_clima" />
                </div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.salesByWeather}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="condition" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            {/* Multi-Axis configuration to handle scale differences: Customers (100) vs Revenue (1M) vs Ticket (10k) */}
                            <YAxis yAxisId="revenue" orientation="left" hide />
                            <YAxis yAxisId="count" orientation="right" hide />
                            <YAxis yAxisId="ticket" orientation="right" hide />
                            
                            <Tooltip 
                                cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                            />
                            <Legend wrapperStyle={{fontSize: '11px'}} />
                            
                            <Bar yAxisId="count" dataKey="customers" name="Clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="revenue" dataKey="revenue" name="Facturación ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="ticket" dataKey="ticket" name="Ticket Prom. ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};