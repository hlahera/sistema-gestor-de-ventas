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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  getReportes,
  getReporte,
  aprobarReporte,
  rechazarReporte,
  type ReporteVenta,
} from '../api/client';

const ReportesList: React.FC = () => {
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reportes de ventas
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Reportes enviados por vendedores, pendientes de revisión y aprobación. Al aprobar, se registrarán las salidas en el inventario.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha reportada</TableCell>
              <TableCell>Vendedor</TableCell>
              <TableCell>Enviado</TableCell>
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
                  <TableCell>{r.fecha}</TableCell>
                  <TableCell>{r.vendedor_username}</TableCell>
                  <TableCell>{new Date(r.creado_en).toLocaleString('es-CL')}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => openDetalle(r.id)}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAprobar(r.id)}
                      sx={{ ml: 1 }}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => openRechazar(r)}
                      sx={{ ml: 1 }}
                    >
                      Rechazar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!detalle && !rechazarOpen} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle del reporte</DialogTitle>
        <DialogContent>
          {detalle && (
            <Box>
              <Typography variant="body2" color="textSecondary">
                Fecha: {detalle.fecha} · Vendedor: {detalle.vendedor_username}
              </Typography>
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.lineas.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.producto_codigo} – {l.producto_nombre}</TableCell>
                        <TableCell align="right">{l.cantidad}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => detalle && handleAprobar(detalle.id)}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => detalle && openRechazar(detalle)}
                >
                  Rechazar
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rechazarOpen} onClose={() => { setRechazarOpen(false); setDetalle(null); }}>
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
