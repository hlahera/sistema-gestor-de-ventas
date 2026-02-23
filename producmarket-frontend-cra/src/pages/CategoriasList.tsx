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
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { getCategorias, deleteCategoria } from '../api/client';
import type { Categoria as CategoriaType } from '../types';
import CategoriaFormDialog from '../components/CategoriaFormDialog';

const CategoriasList: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => {
    getCategorias().then((res) => setCategorias(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (id: number) => {
    setEditingId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    load();
  };

  const handleDelete = (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar categoría "${nombre}"?`)) {
      deleteCategoria(id).then(load);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5">Categorías</Typography>
          <Typography variant="body2" color="textSecondary">
            Clasifica tus productos (ej. Alimentos, Limpieza, Electrónicos)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Nueva categoría
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Productos</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay categorías. Crea una para organizar tus productos.
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.descripcion || '-'}</TableCell>
                  <TableCell align="right">{c.productos_count ?? 0}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(c.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(c.id, c.nombre)}
                    >
                      🗑
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CategoriaFormDialog
        open={open}
        onClose={handleClose}
        editingId={editingId}
      />
    </Box>
  );
};

export default CategoriasList;
