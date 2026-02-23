import React, { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

const today = () => new Date().toISOString().slice(0, 10);

const ReportarVentas: React.FC = () => {
  const [productos, setProductos] = useState<{ id: number; codigo: string; nombre: string }[]>([]);
  const [reportes, setReportes] = useState<ReporteVenta[]>([]);
  const [fecha, setFecha] = useState(today());
  const [lineas, setLineas] = useState<{ producto: number; cantidad: number }[]>([{ producto: 0, cantidad: 1 }]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProductos = () => {
    getProductos({ activo: true })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as { results?: Producto[] }).results || [];
        setProductos(data.map((p: Producto) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre })));
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
    setLineas((prev) => [...prev, { producto: productos[0]?.id ?? 0, cantidad: 1 }]);
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
        setLineas([{ producto: productos[0]?.id ?? 0, cantidad: 1 }]);
        setFecha(today());
        loadReportes();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.fecha?.[0] ||
          err?.response?.data?.detail ||
          'Error al enviar el reporte. ¿Ya reportaste ventas para esta fecha?';
        setError(String(msg));
      })
      .finally(() => setSending(false));
  };

  const estadoColor = (estado: string) =>
    estado === 'aprobado' ? 'success' : estado === 'rechazado' ? 'error' : 'warning';

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reportar ventas del día
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Envía tu reporte de ventas para que el administrador lo revise y apruebe. Solo puedes enviar un reporte por día.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Nuevo reporte
        </Typography>
        <TextField
          label="Fecha del reporte"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mr: 2, mb: 2, minWidth: 160 }}
        />
        {lineas.map((linea, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Producto</InputLabel>
              <Select
                value={linea.producto || ''}
                label="Producto"
                onChange={(e) => updateLinea(index, 'producto', Number(e.target.value) || 0)}
              >
                <MenuItem value="">Seleccione producto</MenuItem>
                {productos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.codigo} – {p.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="number"
              size="small"
              label="Cantidad"
              value={linea.cantidad}
              onChange={(e) => updateLinea(index, 'cantidad', Math.max(0, parseInt(e.target.value, 10) || 0))}
              inputProps={{ min: 1 }}
              sx={{ width: 100 }}
            />
            <IconButton onClick={() => removeLinea(index)} disabled={lineas.length <= 1} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button startIcon={<AddIcon />} onClick={addLinea} sx={{ mb: 2 }}>
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
        >
          {sending ? 'Enviando...' : 'Enviar reporte'}
        </Button>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Mis reportes
      </Typography>
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
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
    </Box>
  );
};

export default ReportarVentas;
