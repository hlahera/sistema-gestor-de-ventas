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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getMovimientosOffline } from '../api/offlineApi';
import type { MovimientoInventario as MovType } from '../types';
import MovimientoDialog from '../components/MovimientoDialog';

const MovimientosList: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = () => {
    getMovimientosOffline()
      .then((res) => setMovimientos(res.data as MovType[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('producmarket-synced', handler);
    return () => window.removeEventListener('producmarket-synced', handler);
  }, []);

  useEffect(() => {
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Movimientos de inventario</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Nuevo movimiento
        </Button>
      </Box>
      <MovimientoDialog open={open} onClose={() => setOpen(false)} onSaved={load} />
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Motivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Cargando...</TableCell>
              </TableRow>
            ) : movimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay movimientos. Registra entradas o salidas desde el botón superior.
                </TableCell>
              </TableRow>
            ) : (
              movimientos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {new Date(m.fecha).toLocaleString('es-CL')}
                  </TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MovimientosList;
