import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Autocomplete,
  createFilterOptions,
  useMediaQuery,
  useTheme,
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

const filterProductos = createFilterOptions<Producto>({
  ignoreCase: true,
  stringify: (option) =>
    `${option.codigo} ${option.nombre} ${option.categoria_nombre ?? ''}`,
});

const MovimientoDialog: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [responsable, setResponsable] = useState(getDefaultResponsable);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getProductosOffline({ activo: true }).then((res) => setProductos(res.data as Producto[]));
      setProductoSel(null);
      setTipo('entrada');
      setCantidad('');
      setMotivo('');
      setResponsable(getDefaultResponsable());
      setError('');
    }
  }, [open]);

  const opcionesOrdenadas = useMemo(
    () => [...productos].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { sensitivity: 'base' })),
    [productos]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cant = parseInt(cantidad, 10);
    if (!productoSel || !cant || cant <= 0) {
      setError('Elige un producto de la lista (escribe para buscar) y una cantidad válida.');
      return;
    }
    const prod = productoSel;
    if (tipo === 'salida' && prod.stock_actual < cant) {
      setError(`Stock insuficiente. Actual: ${prod.stock_actual}`);
      return;
    }
    setSaving(true);
    createMovimientoOffline({
      producto: prod.id,
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} scroll="paper">
      <DialogTitle>Nuevo movimiento</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <Autocomplete
            fullWidth
            value={productoSel}
            onChange={(_, value) => {
              setProductoSel(value);
              setError('');
            }}
            options={opcionesOrdenadas}
            filterOptions={filterProductos}
            getOptionLabel={(p) => `${p.codigo} – ${p.nombre}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Ningún producto coincide; revisa código o nombre"
            renderOption={(props, p) => (
              <li {...props} key={p.id}>
                <Typography variant="body2" component="span">
                  {p.codigo} – {p.nombre}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  Stock: {p.stock_actual}
                  {p.categoria_nombre ? ` · ${p.categoria_nombre}` : ''}
                </Typography>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Producto"
                required
                margin="normal"
                placeholder="Escribe código, nombre o categoría…"
                helperText={
                  productos.length === 0
                    ? 'No hay productos activos'
                    : 'Filtra mientras escribes; debes elegir una fila de la lista'
                }
              />
            )}
          />
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
            margin="normal"
            required
            disabled
            helperText="Se asigna automáticamente según el usuario autenticado."
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
        <DialogActions
          sx={{
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            px: 2,
            pb: 2,
            gap: 1,
            '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' }, m: 0 },
          }}
        >
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
