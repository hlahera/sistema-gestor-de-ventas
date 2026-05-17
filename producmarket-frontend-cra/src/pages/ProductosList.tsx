import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { getProductosOffline, getCategoriasOffline, getImagenProductoUrl } from '../api/offlineApi';
import { deleteProducto, getStoredUser } from '../api/client';
import type { Producto as ProductoType } from '../types';
import type { Categoria as CategoriaType } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile, hideOnTablet, pageContentSx } from '../styles/responsive';

const DEBOUNCE_MS = 400;

const ProductosList: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.tipo === 'admin';
  const [productos, setProductos] = useState<ProductoType[]>([]);
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const params: { categoria?: number; search?: string } = {};
    if (categoriaFiltro) params.categoria = Number(categoriaFiltro);
    if (busqueda.trim()) params.search = busqueda.trim();
    getProductosOffline(params)
      .then((res) => setProductos(res.data as ProductoType[]))
      .finally(() => setLoading(false));
  }, [categoriaFiltro, busqueda]);

  useEffect(() => {
    getCategoriasOffline().then((res) => setCategorias(res.data as CategoriaType[]));
  }, []);

  useEffect(() => {
    window.addEventListener('producmarket-synced', load);
    return () => window.removeEventListener('producmarket-synced', load);
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => setBusqueda(busquedaInput), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar producto "${nombre}"?`)) {
      deleteProducto(id).then(load);
    }
  };

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de inventario con búsqueda por código, nombre o categoría."
        action={
          isAdmin ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/productos/nuevo')}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Nuevo producto
            </Button>
          ) : undefined
        }
      />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por nombre, código o categoría..."
          value={busquedaInput}
          onChange={(e) => setBusquedaInput(e.target.value)}
          sx={{ width: { xs: '100%', sm: 360 }, maxWidth: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Box
          component="label"
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Typography variant="body2" color="textSecondary">Categoría:</Typography>
          <Box
            component="select"
            value={categoriaFiltro}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategoriaFiltro(e.target.value)
            }
            sx={{
              width: { xs: '100%', sm: 240 },
              py: 0.75,
              px: 1.5,
              fontSize: 14,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              '&:focus': { outline: 'none', borderColor: 'primary.main' },
            }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre} {c.productos_count != null ? `(${c.productos_count})` : ''}
              </option>
            ))}
          </Box>
        </Box>
      </Box>
      <DataCard noPadding>
      <ResponsiveTableWrap>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={hideOnMobile}>Imagen</TableCell>
              <TableCell>Código SKU</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell sx={hideOnTablet}>Categoría</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              {isAdmin && <TableCell align="right" sx={hideOnMobile}>Mín.</TableCell>}
              <TableCell sx={hideOnMobile}>Estado</TableCell>
              {isAdmin && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 7}>Cargando...</TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 7} align="center">
                  {busqueda || categoriaFiltro
                    ? 'No hay productos que coincidan con la búsqueda o el filtro.'
                    : 'No hay productos. Crea categorías y luego productos.'}
                </TableCell>
              </TableRow>
            ) : (
              productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell sx={hideOnMobile}>
                    {p.imagen ? (
                      <img
                        src={getImagenProductoUrl(p.imagen)}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <Box sx={{ width: 40, height: 40, bgcolor: 'grey.200', borderRadius: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>{p.codigo}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell sx={hideOnTablet}>{p.categoria_nombre || '-'}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                    }).format(Number(p.precio_venta))}
                  </TableCell>
                  <TableCell align="right">{p.stock_actual}</TableCell>
                  {isAdmin && <TableCell align="right" sx={hideOnMobile}>{p.stock_minimo}</TableCell>}
                  <TableCell sx={hideOnMobile}>
                    {p.bajo_stock ? (
                      <Chip label="Bajo stock" size="small" color="warning" />
                    ) : (
                      <Chip label="OK" size="small" color="success" />
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(`/productos/${p.id}`)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(p.id, p.nombre)}
                      >
                        🗑
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </ResponsiveTableWrap>
      </DataCard>
    </Box>
  );
};

export default ProductosList;
