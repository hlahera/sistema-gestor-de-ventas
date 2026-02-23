import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getDashboardOffline } from '../api/offlineApi';
import { getStoredUser, getVentasPorMes, type VentasPorMesItem } from '../api/client';
import type { DashboardData } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.tipo === 'admin';
  const [data, setData] = useState<DashboardData | null>(null);
  const [ventasPorMes, setVentasPorMes] = useState<VentasPorMesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getDashboardOffline()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Error al cargar'))
      .finally(() => setLoading(false));
    if (isAdmin) {
      getVentasPorMes()
        .then((res) => setVentasPorMes(Array.isArray(res.data) ? res.data : []))
        .catch(() => setVentasPorMes([]));
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('producmarket-synced', handler);
    return () => window.removeEventListener('producmarket-synced', handler);
  }, []);

  if (loading) return <Typography>Cargando...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data) return null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isAdmin ? 'Resumen del inventario (Administrador)' : 'Resumen de ventas'}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Inventory2Icon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography color="textSecondary">Total productos</Typography>
              <Typography variant="h4">{data.total_productos}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningAmberIcon sx={{ fontSize: 40, color: 'orange' }} />
            <Box>
              <Typography color="textSecondary">Bajo stock</Typography>
              <Typography variant="h4">{data.productos_bajo_stock}</Typography>
            </Box>
          </Paper>
        </Grid>
        {isAdmin && (
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'green' }} />
              <Box>
                <Typography color="textSecondary">Valor inventario</Typography>
                <Typography variant="h5">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                  }).format(data.valor_inventario)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      {isAdmin && ventasPorMes.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Importe de ventas por mes
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mes</TableCell>
                  <TableCell align="right">Importe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasPorMes.map((r) => (
                  <TableRow key={`${r.anio}-${r.mes}`}>
                    <TableCell>{r.mes_label}</TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: 'CLP',
                      }).format(r.importe)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      <Typography variant="h6" gutterBottom>
        Últimos movimientos
      </Typography>
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.ultimos_movimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay movimientos recientes
                </TableCell>
              </TableRow>
            ) : (
              data.ultimos_movimientos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.producto_codigo} – {m.producto_nombre}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={m.tipo}
                      size="small"
                      color={m.tipo === 'entrada' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">{m.cantidad}</TableCell>
                  <TableCell>{m.responsable || '—'}</TableCell>
                  <TableCell>{m.motivo || '-'}</TableCell>
                  <TableCell>
                    {new Date(m.fecha).toLocaleString('es-CL')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2 }}>
        <Typography
          component="button"
          variant="body2"
          color="primary"
          onClick={() => navigate('/movimientos')}
          sx={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          Ver todos los movimientos →
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
