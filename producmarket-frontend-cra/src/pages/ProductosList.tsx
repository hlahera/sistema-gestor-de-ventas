import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import { getProductosOffline, getCategoriasOffline, getImagenProductoUrl } from '../api/offlineApi';
import { deleteProducto } from '../api/client';
import type { Producto as ProductoType } from '../types';
import type { Categoria as CategoriaType } from '../types';

const DEBOUNCE_MS = 400;

const ProductosList: React.FC = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<ProductoType[]>([]);
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params: { categoria?: number; search?: string } = {};
    if (categoriaFiltro) params.categoria = Number(categoriaFiltro);
    if (busqueda.trim()) params.search = busqueda.trim();
    getProductosOffline(params)
      .then((res) => setProductos(res.data as ProductoType[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getCategoriasOffline().then((res) => setCategorias(res.data as CategoriaType[]));
  }, []);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('producmarket-synced', handler);
    return () => window.removeEventListener('producmarket-synced', handler);
  }, [categoriaFiltro, busqueda]);

  useEffect(() => {
    const t = window.setTimeout(() => setBusqueda(busquedaInput), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    load();
  }, [categoriaFiltro, busqueda]);

  const handleDelete = (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar producto "${nombre}"?`)) {
      deleteProducto(id).then(load);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Productos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/productos/nuevo')}
        >
          Nuevo producto
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, código o categoría..."
          value={busquedaInput}
          onChange={(e) => setBusquedaInput(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="textSecondary">Categoría:</Typography>
          <Box
            component="select"
            value={categoriaFiltro}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategoriaFiltro(e.target.value)
            }
            sx={{
              minWidth: 200,
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
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Código SKU</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Mín.</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Cargando...</TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {busqueda || categoriaFiltro
                    ? 'No hay productos que coincidan con la búsqueda o el filtro.'
                    : 'No hay productos. Crea categorías y luego productos.'}
                </TableCell>
              </TableRow>
            ) : (
              productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
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
                  <TableCell>{p.categoria_nombre || '-'}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                    }).format(Number(p.precio_venta))}
                  </TableCell>
                  <TableCell align="right">{p.stock_actual}</TableCell>
                  <TableCell align="right">{p.stock_minimo}</TableCell>
                  <TableCell>
                    {p.bajo_stock ? (
                      <Chip label="Bajo stock" size="small" color="warning" />
                    ) : (
                      <Chip label="OK" size="small" color="success" />
                    )}
                  </TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductosList;
