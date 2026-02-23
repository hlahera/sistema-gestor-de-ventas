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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getVendedores,
  getVendedor,
  createVendedor,
  updateVendedor,
  deleteVendedor,
  type Vendedor,
} from '../api/client';

const VendedoresList: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    is_active: true,
  });

  const load = () => {
    setLoading(true);
    getVendedores()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as { results?: Vendedor[] }).results || [];
        setVendedores(data);
      })
      .catch(() => setVendedores([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const isEdit = editingId !== null;

  const handleOpen = () => {
    setEditingId(null);
    setForm({ username: '', password: '', first_name: '', last_name: '', email: '', is_active: true });
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const handleEdit = (v: Vendedor) => {
    setEditingId(v.id);
    setForm({
      username: v.username,
      password: '',
      first_name: v.first_name || '',
      last_name: v.last_name || '',
      email: v.email || '',
      is_active: v.is_active,
    });
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (isEdit && editingId !== null) {
      if (form.password && form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      updateVendedor(editingId, {
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim() || undefined,
        is_active: form.is_active,
        password: form.password.trim() || undefined,
      })
        .then(() => {
          setSuccess('Vendedor actualizado correctamente.');
          handleClose();
          load();
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || 'Error al actualizar.');
        });
    } else {
      if (!form.username.trim()) {
        setError('El usuario es obligatorio.');
        return;
      }
      if (!form.password || form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      createVendedor({
        username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim() || undefined,
      })
        .then(() => {
          setSuccess('Vendedor creado correctamente. Ya puede iniciar sesión con ese usuario y contraseña.');
          setForm({ username: '', password: '', first_name: '', last_name: '', email: '', is_active: true });
          load();
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || err?.response?.data?.username?.[0] || 'Error al crear el vendedor.');
        });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId === null) return;
    deleteVendedor(deleteId)
      .then(() => {
        setSuccess('Vendedor eliminado.');
        setDeleteId(null);
        load();
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Error al eliminar.');
        setDeleteId(null);
      });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5">Vendedores</Typography>
          <Typography variant="body2" color="textSecondary">
            Crea cuentas de vendedor para que puedan reportar ventas e ingresar al sistema.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpen}>
          Crear vendedor
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell>Fecha de alta</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && vendedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>Cargando...</TableCell>
              </TableRow>
            ) : vendedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay vendedores. Crea uno con el botón «Crear vendedor».
                </TableCell>
              </TableRow>
            ) : (
              vendedores.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.username}</TableCell>
                  <TableCell>{v.first_name || '—'}</TableCell>
                  <TableCell>{v.last_name || '—'}</TableCell>
                  <TableCell>{v.email || '—'}</TableCell>
                  <TableCell>{v.is_active ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{new Date(v.date_joined).toLocaleDateString('es-CL')}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(v)} title="Editar">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(v.id)} title="Eliminar">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Editar vendedor' : 'Crear vendedor'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <TextField
              margin="dense"
              label="Usuario"
              required
              fullWidth
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              disabled={isEdit}
              helperText={isEdit ? 'El usuario no se puede cambiar' : undefined}
            />
            <TextField
              margin="dense"
              label={isEdit ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              type="password"
              required={!isEdit}
              fullWidth
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              helperText={isEdit ? undefined : 'Mínimo 6 caracteres'}
              autoComplete={isEdit ? 'new-password' : 'new-password'}
            />
            <TextField
              margin="dense"
              label="Nombre"
              fullWidth
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
            <TextField
              margin="dense"
              label="Apellido"
              fullWidth
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            {isEdit && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                }
                label="Usuario activo (puede iniciar sesión)"
                sx={{ mt: 1 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" startIcon={isEdit ? <EditIcon /> : <AddIcon />}>
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminar vendedor</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este vendedor? No podrá volver a iniciar sesión y se perderán los datos asociados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendedoresList;
