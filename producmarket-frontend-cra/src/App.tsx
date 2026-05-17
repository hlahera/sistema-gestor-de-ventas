import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OfflineProvider } from './offline/OfflineContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Solo administradores pueden acceder a esta ruta */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || user.tipo !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="productos" element={<ProductosList />} />
          <Route path="productos/nuevo" element={<AdminRoute><ProductoForm /></AdminRoute>} />
          <Route path="productos/:id" element={<AdminRoute><ProductoForm /></AdminRoute>} />
          <Route path="categorias" element={<AdminRoute><CategoriasList /></AdminRoute>} />
          <Route path="movimientos" element={<MovimientosList />} />
          <Route path="top-ventas" element={<AdminRoute><TopVentas /></AdminRoute>} />
          <Route path="reportes" element={<AdminRoute><ReportesList /></AdminRoute>} />
          <Route path="vendedores" element={<AdminRoute><VendedoresList /></AdminRoute>} />
          <Route path="reportar-ventas" element={<ReportarVentas />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <OfflineProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </OfflineProvider>
  );
}

export default App;
