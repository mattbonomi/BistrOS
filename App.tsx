import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClientView } from './components/client/ClientView';
import { Dashboard } from './components/admin/Dashboard';
import { Home } from './components/Home';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/table/:tableId" element={<ClientView />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;