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
  TextField,
  IconButton,
  Alert,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import {
  getProductos,
  getReportes,
  createReporte,
  type ReporteVenta,
  type ReporteVentaLineaItem,
} from '../api/client';
import type { Producto } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { pageContentSx } from '../styles/responsive';

/** Fecha local YYYY-MM-DD (evita que toISOString use UTC y cambie el día). */
function fechaLocalHoy(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const formatoPeso = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

const ReportarVentas: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [reportes, setReportes] = useState<ReporteVenta[]>([]);
  const [fecha, setFecha] = useState(() => fechaLocalHoy());
  const [lineas, setLineas] = useState<{ producto: number; cantidad: number }[]>([
    { producto: 0, cantidad: 1 },
  ]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProductos = () => {
    getProductos({ activo: true })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as { results?: Producto[] }).results || [];
        setProductos(data);
      })
      .catch(() => setProductos([]));
  };

  const loadReportes = () => {
    getReportes()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as { results?: ReporteVenta[] }).results || [];
        setReportes(data);
      })
      .catch(() => setReportes([]));
  };

  useEffect(() => {
    setLoading(true);
    loadProductos();
    loadReportes();
    setLoading(false);
  }, []);

  const addLinea = () => {
    setLineas((prev) => [...prev, { producto: 0, cantidad: 1 }]);
  };

  const removeLinea = (index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLinea = (index: number, field: 'producto' | 'cantidad', value: number) => {
    setLineas((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = () => {
    const valid: ReporteVentaLineaItem[] = lineas.filter(
      (l) => l.producto > 0 && l.cantidad > 0
    );
    if (valid.length === 0) {
      setError('Añade al menos un producto con cantidad mayor a 0.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSending(true);
    createReporte({ fecha, lineas: valid })
      .then(() => {
        setSuccess('Reporte enviado. Quedará pendiente de aprobación del administrador.');
        setLineas([{ producto: 0, cantidad: 1 }]);
        setFecha(fechaLocalHoy());
        loadReportes();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.fecha?.[0] ||
          err?.response?.data?.detail ||
          'Error al enviar el reporte.';
        setError(String(msg));
      })
      .finally(() => setSending(false));
  };

  const estadoColor = (estado: string) =>
    estado === 'aprobado' ? 'success' : estado === 'rechazado' ? 'error' : 'warning';

  const totalEstimadoReporte = useMemo(
    () =>
      lineas.reduce((sum, l) => {
        if (l.producto <= 0 || l.cantidad <= 0) return sum;
        const p = productos.find((x) => x.id === l.producto);
        if (!p) return sum;
        return sum + l.cantidad * Number(p.precio_venta);
      }, 0),
    [lineas, productos]
  );

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title="Reportar ventas"
        subtitle="Envía reportes cuando los necesites; el administrador los revisará y aprobará o rechazará."
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Nuevo reporte
        </Typography>
        <TextField
          label="Fecha del reporte"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            max: fechaLocalHoy(),
          }}
          helperText=""
          sx={{ mb: 2, width: { xs: '100%', sm: 260 } }}
        />
        {lineas.map((linea, index) => {
          const prodSel = linea.producto > 0 ? productos.find((p) => p.id === linea.producto) : null;
          const subtotalLinea =
            prodSel && linea.cantidad > 0
              ? linea.cantidad * Number(prodSel.precio_venta)
              : null;
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 2,
              }}
            >
              <Autocomplete
                size="small"
                options={productos}
                getOptionLabel={(p) => `${p.codigo} – ${p.nombre}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={prodSel ?? null}
                onChange={(_, v) => updateLinea(index, 'producto', v?.id ?? 0)}
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter(
                    (p) =>
                      p.codigo.toLowerCase().includes(q) ||
                      p.nombre.toLowerCase().includes(q) ||
                      `${p.codigo} ${p.nombre}`.toLowerCase().includes(q)
                  );
                }}
                noOptionsText="Sin coincidencias en catálogo"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Producto"
                    placeholder="Escribe código o nombre…"
                    helperText=""
                  />
                )}
                sx={{ width: { xs: '100%', sm: 380 }, maxWidth: '100%' }}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'flex-start' },
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <TextField
                  type="number"
                  size="small"
                  label="Cantidad"
                  value={linea.cantidad}
                  onChange={(e) =>
                    updateLinea(index, 'cantidad', Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  inputProps={{ min: 1 }}
                  sx={{ width: { xs: '100%', sm: 120 } }}
                />
                {subtotalLinea != null && (
                  <Typography variant="body2" color="textSecondary" sx={{ pt: { sm: 1 }, whiteSpace: 'nowrap' }}>
                    Subtotal: {formatoPeso(subtotalLinea)}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-start' }, pt: { sm: 0.5 } }}>
                <IconButton onClick={() => removeLinea(index)} disabled={lineas.length <= 1} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          );
        })}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Total estimado del reporte 
          </Typography>
          <Typography variant="h6" component="p">
            {formatoPeso(totalEstimadoReporte)}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
           
          </Typography>
        </Paper>
        <Button startIcon={<AddIcon />} onClick={addLinea} sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }}>
          Añadir línea
        </Button>
        <br />
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={sending || loading}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {sending ? 'Enviando...' : 'Enviar reporte'}
        </Button>
      </Paper>

      <DataCard title="Mis reportes" noPadding>
      <ResponsiveTableWrap showScrollHint={false}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha reporte</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Enviado</TableCell>
              <TableCell>Observaciones</TableCell>
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
                  Aún no has enviado reportes
                </TableCell>
              </TableRow>
            ) : (
              reportes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.fecha}</TableCell>
                  <TableCell>
                    <Typography component="span" color={`${estadoColor(r.estado)}.main`}>
                      {r.estado === 'pendiente' ? 'Pendiente' : r.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(r.creado_en).toLocaleString('es-CL')}</TableCell>
                  <TableCell>{r.observaciones || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </ResponsiveTableWrap>
      </DataCard>
    </Box>
  );
};

export default ReportarVentas;
