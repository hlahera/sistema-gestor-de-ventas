import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material';
import { getProductosOffline, createMovimientoOffline } from '../api/offlineApi';
import { getStoredUser } from '../api/client';
import type { Producto } from '../types';

function getDefaultResponsable(): string {
  const user = getStoredUser();
  if (!user) return '';
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  }
  return user.username;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const MovimientoDialog: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [responsable, setResponsable] = useState(getDefaultResponsable);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getProductosOffline({ activo: true }).then((res) => setProductos(res.data as Producto[]));
      setProductoId('');
      setTipo('entrada');
      setCantidad('');
      setMotivo('');
      setResponsable(getDefaultResponsable());
      setError('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cant = parseInt(cantidad, 10);
    if (!productoId || !cant || cant <= 0) {
      setError('Selecciona un producto y una cantidad válida.');
      return;
    }
    const prod = productos.find((p) => p.id === Number(productoId));
    if (tipo === 'salida' && prod && prod.stock_actual < cant) {
      setError(`Stock insuficiente. Actual: ${prod.stock_actual}`);
      return;
    }
    setSaving(true);
    createMovimientoOffline({
      producto: Number(productoId),
      tipo,
      cantidad: cant,
      motivo: motivo.trim() || undefined,
      responsable: responsable.trim() || undefined,
    })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo movimiento</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <TextField
            fullWidth
            select
            label="Producto"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            required
            margin="normal"
          >
            <MenuItem value="">Seleccionar...</MenuItem>
            {productos.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.codigo} – {p.nombre} (stock: {p.stock_actual})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'entrada' | 'salida')}
            margin="normal"
          >
            <MenuItem value="entrada">Entrada</MenuItem>
            <MenuItem value="salida">Salida</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Responsable"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            margin="normal"
            required
            placeholder="Nombre de quien registra el movimiento"
          />
          <TextField
            fullWidth
            type="number"
            label="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            inputProps={{ min: 1 }}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MovimientoDialog;
