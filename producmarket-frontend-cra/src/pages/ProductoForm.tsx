import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  MenuItem,
  InputAdornment,
  Alert,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { getCategorias, getProducto, createProducto, updateProducto } from '../api/client';
import { getImagenProductoUrl } from '../api/client';
import type { Categoria as CategoriaType } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { pageContentSx } from '../styles/responsive';

const UNIDADES = ['und', 'kg', 'L', 'unidad', 'caja', 'pack'];

function firstApiMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.detail === 'string') return d.detail;
  for (const v of Object.values(d)) {
    if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
    if (typeof v === 'string') return v;
  }
  return null;
}

const ProductoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('0');
  const [unidadMedida, setUnidadMedida] = useState('und');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenActual, setImagenActual] = useState<string | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getCategorias().then((res) => setCategorias(res.data));
    if (id) {
      getProducto(Number(id)).then((res) => {
        const p = res.data;
        setCodigo(p.codigo);
        setNombre(p.nombre);
        setDescripcion(p.descripcion || '');
        setCategoriaId(p.categoria ? String(p.categoria) : '');
        setPrecioVenta(p.precio_venta);
        setStockMinimo(String(p.stock_minimo));
        setUnidadMedida(p.unidad_medida || 'und');
        setImagenActual(p.imagen ? getImagenProductoUrl(p.imagen) : null);
        setActivo(p.activo);
      });
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodigoError(null);
    setSubmitError(null);
    setSaving(true);
    const payload = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      categoria: categoriaId ? Number(categoriaId) : null,
      precio_venta: precioVenta ? Number(precioVenta) : 0,
      stock_minimo: Number(stockMinimo) || 0,
      unidad_medida: unidadMedida,
      activo,
    };
    const onError = (err: unknown) => {
      const ax = err as { response?: { data?: unknown } };
      const data = ax.response?.data;
      const codigoMsgs = data && typeof data === 'object' && 'codigo' in data
        ? (data as { codigo?: string | string[] }).codigo
        : undefined;
      const codigoMsg = Array.isArray(codigoMsgs)
        ? codigoMsgs[0]
        : typeof codigoMsgs === 'string'
          ? codigoMsgs
          : null;
      if (codigoMsg) {
        setCodigoError(codigoMsg);
        return;
      }
      const general = firstApiMessage(data);
      setSubmitError(general || 'No se pudo guardar el producto. Revisa los datos e intenta de nuevo.');
    };

    if (isEdit) {
      updateProducto(
        Number(id),
        payload,
        imagenFile || undefined,
        quitarImagen
      )
        .then(() => navigate('/productos'))
        .catch(onError)
        .finally(() => setSaving(false));
    } else {
      (payload as Record<string, unknown>).stock_actual = Number(stockInicial) || 0;
      createProducto(payload, imagenFile || undefined)
        .then(() => navigate('/productos'))
        .catch(onError)
        .finally(() => setSaving(false));
    }
  };

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title={isEdit ? 'Editar producto' : 'Nuevo producto'}
        subtitle={isEdit ? 'Actualiza los datos del catálogo.' : 'Completa la ficha para añadir al inventario.'}
      />
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, width: '100%', boxSizing: 'border-box', mx: { xs: 0, sm: 0 } }}
      >
        <form onSubmit={handleSubmit}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Código SKU"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value);
              if (codigoError) setCodigoError(null);
            }}
            required
            margin="normal"
            disabled={isEdit}
            error={Boolean(codigoError)}
            helperText={
              codigoError ||
              (isEdit ? 'El código SKU no se puede modificar' : undefined)
            }
          />
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
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Categoría"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            margin="normal"
          >
            <MenuItem value="">Sin categoría</MenuItem>
            {categorias.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="number"
            label="Precio de venta"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            margin="normal"
          />
          {!isEdit && (
            <TextField
              fullWidth
              type="number"
              label="Stock inicial"
              value={stockInicial}
              onChange={(e) => setStockInicial(e.target.value)}
              inputProps={{ min: 0 }}
              margin="normal"
            />
          )}
          <TextField
            fullWidth
            type="number"
            label="Stock mínimo (alerta)"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            inputProps={{ min: 0 }}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Unidad de medida"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            margin="normal"
          >
            {UNIDADES.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Imagen (opcional)
            </Typography>
            <input
              accept="image/*"
              type="file"
              id="imagen-producto"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImagenFile(f || null);
                setQuitarImagen(false);
                e.target.value = '';
              }}
              style={{ marginTop: 4, marginRight: 8 }}
            />
            {(imagenFile || (imagenActual && !quitarImagen)) && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <img
                  src={imagenFile ? URL.createObjectURL(imagenFile) : imagenActual || ''}
                  alt="Vista previa"
                  style={{ maxWidth: 120, maxHeight: 120, objectFit: 'contain', borderRadius: 4 }}
                />
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteForeverIcon />}
                  onClick={() => {
                    setImagenFile(null);
                    setImagenActual(null);
                    setQuitarImagen(true);
                    const input = document.getElementById('imagen-producto') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                >
                  Quitar imagen
                </Button>
              </Box>
            )}
          </Box>
          <FormControlLabel
            control={
              <Switch checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            }
            label="Activo"
            sx={{ mt: 1 }}
          />
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: 1,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/productos')}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Cancelar
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ProductoForm;
