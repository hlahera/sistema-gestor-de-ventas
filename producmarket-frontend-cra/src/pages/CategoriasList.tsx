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
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getCategorias, deleteCategoria } from '../api/client';
import type { Categoria as CategoriaType } from '../types';
import CategoriaFormDialog from '../components/CategoriaFormDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile, pageContentSx } from '../styles/responsive';

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
    <Box sx={pageContentSx}>
      <PageHeader
        title="Categorías"
        subtitle="Clasifica tus productos (ej. Alimentos, Limpieza, Electrónicos)."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Nueva categoría
          </Button>
        }
      />

      <DataCard noPadding>
        <ResponsiveTableWrap showScrollHint={false}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell sx={hideOnMobile}>Descripción</TableCell>
                  <TableCell align="right">Productos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      No hay categorías. Crea una para organizar tus productos.
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.nombre}</TableCell>
                      <TableCell sx={hideOnMobile}>{c.descripcion || '—'}</TableCell>
                      <TableCell align="right">{c.productos_count ?? 0}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => handleEdit(c.id)} aria-label="Editar">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(c.id, c.nombre)}
                          aria-label="Eliminar"
                        >
                          <DeleteOutlineIcon fontSize="small" />
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

      <CategoriaFormDialog open={open} onClose={handleClose} editingId={editingId} />
    </Box>
  );
};

export default CategoriasList;
