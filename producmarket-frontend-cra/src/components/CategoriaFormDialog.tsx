import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { getCategoria, createCategoria, updateCategoria } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  editingId: number | null;
}

const CategoriaFormDialog: React.FC<Props> = ({ open, onClose, editingId }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  const editing = editingId != null;

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      getCategoria(editingId).then((res) => {
        setNombre(res.data.nombre);
        setDescripcion(res.data.descripcion || '');
      });
    } else {
      setNombre('');
      setDescripcion('');
    }
  }, [open, editingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      updateCategoria(editingId, { nombre: nombre.trim(), descripcion: descripcion.trim() })
        .then(onClose)
        .finally(() => setSaving(false));
    } else {
      createCategoria({ nombre: nombre.trim(), descripcion: descripcion.trim() })
        .then(onClose)
        .finally(() => setSaving(false));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} scroll="paper">
      <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoriaFormDialog;
