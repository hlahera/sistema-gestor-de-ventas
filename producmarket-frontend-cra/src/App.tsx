import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OfflineProvider } from './offline/OfflineContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductosList from './pages/ProductosList';
import ProductoForm from './pages/ProductoForm';
import CategoriasList from './pages/CategoriasList';
import MovimientosList from './pages/MovimientosList';
import TopVentas from './pages/TopVentas';
import ReportarVentas from './pages/ReportarVentas';
import ReportesList from './pages/ReportesList';
import VendedoresList from './pages/VendedoresList';
import { getStoredUser } from './api/client';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  const isAuth = localStorage.getItem('isAuthenticated') === 'true' && user;
  if (!isAuth) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Solo administradores pueden acceder a esta ruta */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user || user.tipo !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  const user = getStoredUser();
  const isAuth = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true' && user;
  return (
    <OfflineProvider>
      <BrowserRouter>
        <Routes>
        <Route
          path="/"
          element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="productos" element={<ProductosList />} />
          <Route path="productos/nuevo" element={<ProductoForm />} />
          <Route path="productos/:id" element={<ProductoForm />} />
          <Route path="categorias" element={<AdminRoute><CategoriasList /></AdminRoute>} />
          <Route path="movimientos" element={<MovimientosList />} />
          <Route path="top-ventas" element={<AdminRoute><TopVentas /></AdminRoute>} />
          <Route path="reportes" element={<AdminRoute><ReportesList /></AdminRoute>} />
          <Route path="vendedores" element={<AdminRoute><VendedoresList /></AdminRoute>} />
          <Route path="reportar-ventas" element={<ReportarVentas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OfflineProvider>
  );
}

export default App;
