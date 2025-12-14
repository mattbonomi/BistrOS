import React, { useEffect, useState } from 'react';
import { backend } from '../../services/mockBackend';
import { TableBoard } from './TableBoard';
import { ReportsView } from './ReportsView';
import { LayoutGrid, BarChart3, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'TABLES' | 'REPORTS';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewMode>('TABLES');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Real-time synchronization
  useEffect(() => {
    // Subscribe to manager updates (global events)
    const unsubscribe = backend.subscribeManager(() => {
        setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const tables = backend.getTables();

  const renderView = () => {
    switch(currentView) {
        case 'TABLES': return <TableBoard tables={tables} />;
        case 'REPORTS': return <ReportsView />;
        default: return <TableBoard tables={tables} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-gray-900 text-white flex flex-col justify-between">
        <div>
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 font-bold text-xl tracking-wider border-b border-gray-800">
                <span className="hidden lg:inline">BistrOS</span>
                <span className="lg:hidden">B</span>
            </div>
            
            <nav className="mt-8 flex flex-col space-y-2 px-2">
                <button 
                    onClick={() => setCurrentView('TABLES')}
                    className={`flex items-center p-3 rounded-lg transition-colors ${currentView === 'TABLES' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <LayoutGrid size={20} />
                    <span className="ml-3 hidden lg:inline font-medium">Mesas</span>
                </button>

                <button 
                    onClick={() => setCurrentView('REPORTS')}
                    className={`flex items-center p-3 rounded-lg transition-colors ${currentView === 'REPORTS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <BarChart3 size={20} />
                    <span className="ml-3 hidden lg:inline font-medium">Reportes</span>
                </button>
            </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
             <button 
                onClick={() => navigate('/')}
                className="flex items-center justify-center lg:justify-start text-red-400 hover:text-red-300 w-full p-2"
            >
                <LogOut size={20} />
                <span className="ml-3 hidden lg:inline text-sm">Salir</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">
                {currentView === 'TABLES' && 'Tablero de Mesas'}
                {currentView === 'REPORTS' && 'Métricas y Reportes'}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    Sistema en línea
                </div>
            </div>
        </header>
        
        <div className="p-6">
            {renderView()}
        </div>
      </main>
    </div>
  );
};