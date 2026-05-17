import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Skeleton,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getDashboardOffline } from '../api/offlineApi';
import { getStoredUser, getVentasPorMes, type VentasPorMesItem } from '../api/client';
import type { DashboardData } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile, hideOnTablet, pageContentSx } from '../styles/responsive';

const formatoPeso = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.tipo === 'admin';
  const [data, setData] = useState<DashboardData | null>(null);
  const [ventasPorMes, setVentasPorMes] = useState<VentasPorMesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
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
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('producmarket-synced', load);
    return () => window.removeEventListener('producmarket-synced', load);
  }, [load]);

  if (error) {
    return (
      <Box>
        <PageHeader title="Dashboard" />
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title={isAdmin ? 'Panel de administración' : 'Tu resumen'}
        subtitle={
          isAdmin
            ? 'Vista general del inventario, alertas de stock y actividad reciente.'
            : 'Consulta tus movimientos recientes y el estado del catálogo.'
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[0, 1, isAdmin ? 2 : null].filter((i) => i !== null).map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            {loading ? (
              <Skeleton variant="rounded" height={108} sx={{ borderRadius: 3 }} />
            ) : i === 0 ? (
              <StatCard
                label="Total productos"
                value={data?.total_productos ?? 0}
                icon={<Inventory2Icon />}
                accent="primary"
              />
            ) : i === 1 ? (
              <StatCard
                label="Bajo stock"
                value={data?.productos_bajo_stock ?? 0}
                icon={<WarningAmberIcon />}
                accent="warning"
              />
            ) : (
              <StatCard
                label="Valor inventario"
                value={formatoPeso(data?.valor_inventario ?? 0)}
                icon={<AttachMoneyIcon />}
                accent="success"
              />
            )}
          </Grid>
        ))}
      </Grid>

      {isAdmin && (
        <DataCard title="Importe de ventas por mes" noPadding>
          {loading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton height={200} />
            </Box>
          ) : ventasPorMes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
              Aún no hay datos de ventas por mes.
            </Typography>
          ) : (
            <ResponsiveTableWrap>
            <TableContainer>
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
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatoPeso(r.importe)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </ResponsiveTableWrap>
          )}
        </DataCard>
      )}

      <DataCard
        title="Últimos movimientos"
        action={
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/movimientos')}
          >
            Ver todos
          </Button>
        }
        noPadding
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={240} />
          </Box>
        ) : (
          <ResponsiveTableWrap>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell sx={hideOnTablet}>Responsable</TableCell>
                  <TableCell sx={hideOnMobile}>Motivo</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!data?.ultimos_movimientos.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay movimientos recientes
                    </TableCell>
                  </TableRow>
                ) : (
                  data.ultimos_movimientos.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                          {m.producto_codigo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                          {m.producto_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                          size="small"
                          color={m.tipo === 'entrada' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{m.cantidad}</TableCell>
                      <TableCell sx={hideOnTablet}>{m.responsable || '—'}</TableCell>
                      <TableCell sx={hideOnMobile}>{m.motivo || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {new Date(m.fecha).toLocaleString('es-CL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </ResponsiveTableWrap>
        )}
      </DataCard>
    </Box>
  );
};

export default Dashboard;
