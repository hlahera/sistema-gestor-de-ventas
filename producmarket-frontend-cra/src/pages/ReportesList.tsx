import React, { useEffect, useMemo, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import {
  getReportes,
  getReporte,
  aprobarReporte,
  rechazarReporte,
  type ReporteVenta,
} from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile } from '../styles/responsive';
import { pageContentSx } from '../styles/responsive';
import { useIsMobile } from '../hooks/useIsMobile';

const formatoPeso = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

/** Una fila por producto: si el reporte trae varias líneas del mismo producto, se suman las cantidades. */
function agruparLineasPorProducto(lineas: ReporteVenta['lineas']) {
  const map = new Map<
    number,
    {
      producto: number;
      producto_codigo: string;
      producto_nombre: string;
      cantidad: number;
      precio_venta?: string;
    }
  >();
  for (const l of lineas) {
    const prev = map.get(l.producto);
    if (prev) {
      prev.cantidad += l.cantidad;
    } else {
      map.set(l.producto, {
        producto: l.producto,
        producto_codigo: l.producto_codigo,
        producto_nombre: l.producto_nombre,
        cantidad: l.cantidad,
        precio_venta: l.precio_venta,
      });
    }
  }
  return Array.from(map.values());
}

const ReportesList: React.FC = () => {
  const isMobile = useIsMobile();
  const [reportes, setReportes] = useState<ReporteVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<ReporteVenta | null>(null);
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getReportes('pendiente')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as { results?: ReporteVenta[] }).results || [];
        setReportes(data);
      })
      .catch(() => setReportes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openDetalle = (id: number) => {
    getReporte(id)
      .then((res) => setDetalle(res.data))
      .catch(() => setError('Error al cargar el reporte'));
  };

  const handleAprobar = (id: number) => {
    setError(null);
    aprobarReporte(id)
      .then(() => {
        setDetalle(null);
        load();
      })
      .catch((err) => setError(err?.response?.data?.detail || 'Error al aprobar'));
  };

  const handleRechazar = (id: number) => {
    setError(null);
    rechazarReporte(id, observaciones)
      .then(() => {
        setRechazarOpen(false);
        setObservaciones('');
        setDetalle(null);
        load();
      })
      .catch((err) => setError(err?.response?.data?.detail || 'Error al rechazar'));
  };

  const openRechazar = (r: ReporteVenta) => {
    setDetalle(r);
    setObservaciones('');
    setRechazarOpen(true);
  };

  const lineasDetalleAgrupadas = useMemo(() => {
    if (!detalle?.lineas?.length) return [];
    return agruparLineasPorProducto(detalle.lineas);
  }, [detalle]);

  const totalDetalleReporte = useMemo(
    () =>
      lineasDetalleAgrupadas.reduce(
        (sum, l) => sum + l.cantidad * Number(l.precio_venta ?? 0),
        0
      ),
    [lineasDetalleAgrupadas]
  );

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title="Reportes de ventas"
        subtitle="Pendientes de revisión. Al aprobar, se registran las salidas en inventario."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataCard title="Pendientes" noPadding>
      <ResponsiveTableWrap>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Vendedor</TableCell>
              <TableCell sx={hideOnMobile}>Enviado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && reportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>Cargando...</TableCell>
              </TableRow>
            ) : reportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay reportes pendientes
                </TableCell>
              </TableRow>
            ) : (
              reportes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Box component="span" sx={{ fontWeight: 600 }}>{r.fecha}</Box>
                    <Box
                      component="span"
                      sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                      {r.vendedor_username}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{r.vendedor_username}</TableCell>
                  <TableCell sx={hideOnMobile}>
                    {new Date(r.creado_en).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'top', minWidth: { xs: 120, sm: 'auto' } }}>
                    <Stack
                      direction="column"
                      spacing={0.75}
                      alignItems="stretch"
                      sx={{ minWidth: { xs: 100, sm: 'auto' } }}
                    >
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => openDetalle(r.id)}
                        fullWidth
                      >
                        Ver
                      </Button>
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAprobar(r.id)}
                        fullWidth
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => openRechazar(r)}
                        fullWidth
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </ResponsiveTableWrap>
      </DataCard>

      <Dialog
        open={!!detalle && !rechazarOpen}
        onClose={() => setDetalle(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1,
          }}
        >
          <Typography component="span" variant="h6">
            Detalle del reporte
          </Typography>
          <IconButton
            aria-label="Cerrar"
            onClick={() => setDetalle(null)}
            edge="end"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detalle && (
            <Box>
              <Typography variant="body2" color="textSecondary">
                Fecha: {detalle.fecha} · Vendedor: {detalle.vendedor_username}
              </Typography>
              <ResponsiveTableWrap>
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">P. unitario</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineasDetalleAgrupadas.map((l) => {
                      const pu = Number(l.precio_venta ?? 0);
                      const sub = l.cantidad * pu;
                      return (
                        <TableRow key={l.producto}>
                          <TableCell>{l.producto_codigo} – {l.producto_nombre}</TableCell>
                          <TableCell align="right">{formatoPeso(pu)}</TableCell>
                          <TableCell align="right">{l.cantidad}</TableCell>
                          <TableCell align="right">{formatoPeso(sub)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              </ResponsiveTableWrap>
              <Paper variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="h6" component="p">
                  {formatoPeso(totalDetalleReporte)}
                </Typography>
              </Paper>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => detalle && handleAprobar(detalle.id)}
                  fullWidth
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => detalle && openRechazar(detalle)}
                  fullWidth
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Rechazar
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={rechazarOpen}
        onClose={() => { setRechazarOpen(false); setDetalle(null); }}
        fullScreen={isMobile}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rechazar reporte</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Indica el motivo del rechazo para el vendedor..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRechazarOpen(false); setDetalle(null); }}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => detalle && handleRechazar(detalle.id)}
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportesList;
