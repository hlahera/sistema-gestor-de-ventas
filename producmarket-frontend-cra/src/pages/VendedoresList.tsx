import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
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
  createVendedor,
  updateVendedor,
  deleteVendedor,
  type Vendedor,
} from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile, hideOnTablet, pageContentSx } from '../styles/responsive';
import { useIsMobile } from '../hooks/useIsMobile';

const VendedoresList: React.FC = () => {
  const isMobile = useIsMobile();
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
    telefono: '',
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
    setForm({ username: '', password: '', first_name: '', last_name: '', telefono: '', is_active: true });
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
      telefono: v.telefono || '',
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
        telefono: form.telefono.trim() || undefined,
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
        telefono: form.telefono.trim() || undefined,
      })
        .then(() => {
          setSuccess('Vendedor creado correctamente. Ya puede iniciar sesión con ese usuario y contraseña.');
          setForm({ username: '', password: '', first_name: '', last_name: '', telefono: '', is_active: true });
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
    <Box sx={pageContentSx}>
      <PageHeader
        title="Vendedores"
        subtitle="Crea cuentas para que reporten ventas e ingresen al sistema."
        action={
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpen}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Crear vendedor
          </Button>
        }
      />

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <DataCard noPadding>
      <ResponsiveTableWrap>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell sx={hideOnMobile}>Nombre</TableCell>
              <TableCell sx={hideOnTablet}>Apellido</TableCell>
              <TableCell sx={hideOnTablet}>Teléfono</TableCell>
              <TableCell sx={hideOnMobile}>Activo</TableCell>
              <TableCell sx={hideOnMobile}>Alta</TableCell>
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
                <TableRow key={v.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{v.username}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }}>
                      {[v.first_name, v.last_name].filter(Boolean).join(' ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={hideOnMobile}>{v.first_name || '—'}</TableCell>
                  <TableCell sx={hideOnTablet}>{v.last_name || '—'}</TableCell>
                  <TableCell sx={hideOnTablet}>{v.telefono || '—'}</TableCell>
                  <TableCell sx={hideOnMobile}>{v.is_active ? 'Sí' : 'No'}</TableCell>
                  <TableCell sx={hideOnMobile}>{new Date(v.date_joined).toLocaleDateString('es-CL')}</TableCell>
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
      </ResponsiveTableWrap>
      </DataCard>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
      >
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
              label="Teléfono"
              type="tel"
              fullWidth
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="Ej. +56 9 1234 5678"
              inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
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
          <DialogActions sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, px: 2, pb: 2, gap: 1 }}>
            <Button onClick={handleClose} fullWidth sx={{ m: 0 }}>Cancelar</Button>
            <Button type="submit" variant="contained" fullWidth sx={{ m: 0 }} startIcon={isEdit ? <EditIcon /> : <AddIcon />}>
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} fullWidth maxWidth="xs" fullScreen={isMobile}>
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
