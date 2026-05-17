import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TextField,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TodayIcon from '@mui/icons-material/Today';
import ClearIcon from '@mui/icons-material/Clear';
import { getMovimientosOffline } from '../api/offlineApi';
import type { MovimientoInventario as MovType } from '../types';
import MovimientoDialog from '../components/MovimientoDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile, hideOnTablet, pageContentSx } from '../styles/responsive';

const formatoPeso = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

function fechaHoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tipoNorm(m: MovType): string {
  return String(m.tipo ?? '').toLowerCase().trim();
}

function esSalida(m: MovType): boolean {
  return tipoNorm(m) === 'salida';
}

function esEntrada(m: MovType): boolean {
  return tipoNorm(m) === 'entrada';
}

function importeSalida(m: MovType): number {
  if (!esSalida(m)) return 0;
  return m.cantidad * Number(m.precio_venta ?? 0);
}

function salidaSinPrecioCatalogo(m: MovType): boolean {
  return (
    esSalida(m) &&
    (m.precio_venta === undefined || m.precio_venta === null || String(m.precio_venta).trim() === '')
  );
}

const MovimientosList: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const fecha = fechaFiltro || '';
    getMovimientosOffline(fecha ? { fecha } : undefined)
      .then((res) => setMovimientos(res.data as MovType[]))
      .catch(() => setMovimientos([]))
      .finally(() => setLoading(false));
  }, [fechaFiltro]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('producmarket-synced', load);
    return () => window.removeEventListener('producmarket-synced', load);
  }, [load]);

  const recaudacionDia = useMemo(() => {
    if (!fechaFiltro) return null;
    return movimientos.reduce((sum, m) => sum + importeSalida(m), 0);
  }, [fechaFiltro, movimientos]);

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title="Movimientos de inventario"
        subtitle="Registra entradas y salidas. Filtra por día para ver la recaudación."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Nuevo movimiento
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Filtrar por día
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            type="date"
            label="Día"
            size="small"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={() => setFechaFiltro(fechaHoyLocal())}
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              Hoy
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<ClearIcon />}
              onClick={() => setFechaFiltro('')}
              disabled={!fechaFiltro}
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              Ver todos
            </Button>
          </Stack>
        </Stack>
        {fechaFiltro && recaudacionDia !== null && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Recaudación del día
            </Typography>
            <Typography variant="h6" component="p">
              {formatoPeso(recaudacionDia)}
            </Typography>
          </Box>
        )}
      </Paper>

      <MovimientoDialog open={open} onClose={() => setOpen(false)} onSaved={load} />

      <DataCard title="Listado" noPadding>
        <ResponsiveTableWrap>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={hideOnMobile}>Fecha</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right" sx={hideOnTablet}>
                    Importe
                  </TableCell>
                  <TableCell sx={hideOnTablet}>Responsable</TableCell>
                  <TableCell sx={hideOnMobile}>Motivo</TableCell>
                  <TableCell sx={{ display: { xs: 'table-cell', sm: 'none' } }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Cargando...</TableCell>
                  </TableRow>
                ) : movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      {fechaFiltro
                        ? `No hay movimientos el ${fechaFiltro}.`
                        : 'No hay movimientos. Registra entradas o salidas desde el botón superior.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((m) => {
                    const imp = importeSalida(m);
                    const fechaStr = new Date(m.fecha).toLocaleString('es-CL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });
                    return (
                      <TableRow key={m.id} hover>
                        <TableCell sx={hideOnMobile}>{fechaStr}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 140, sm: 200 } }}>
                            {m.producto_codigo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: { xs: 160, sm: 240 }, display: 'block' }}>
                            {m.producto_nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            size="small"
                            color={esEntrada(m) ? 'success' : esSalida(m) ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{m.cantidad}</TableCell>
                        <TableCell align="right" sx={hideOnTablet}>
                          {esEntrada(m) || !esSalida(m)
                            ? '—'
                            : salidaSinPrecioCatalogo(m)
                              ? '—'
                              : formatoPeso(imp)}
                        </TableCell>
                        <TableCell sx={hideOnTablet}>{m.responsable || '—'}</TableCell>
                        <TableCell sx={hideOnMobile}>{m.motivo || '—'}</TableCell>
                        <TableCell sx={{ display: { xs: 'table-cell', sm: 'none' }, whiteSpace: 'nowrap' }}>
                          {fechaStr}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </ResponsiveTableWrap>
      </DataCard>
    </Box>
  );
};

export default MovimientosList;
