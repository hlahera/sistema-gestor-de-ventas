import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';
const MEDIA_BASE = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

/** Token de autenticación: se establece tras login y se envía en las peticiones */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

/** Usuario actual (se rellena tras login y se persiste en localStorage) */
export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  tipo: 'admin' | 'vendedor';
}

const USER_STORAGE_KEY = 'producmarket_user';
const TOKEN_STORAGE_KEY = 'producmarket_token';

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_STORAGE_KEY);

export const setStoredAuth = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
  setAuthToken(token);
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('user'); // clave antigua del login anterior
  setAuthToken(null);
};

// Restaurar token al cargar la app (p. ej. tras recargar la página)
try {
  if (typeof localStorage !== 'undefined') {
    const token = getStoredToken();
    if (token) setAuthToken(token);
  }
} catch {
  // Ignorar si localStorage no está disponible (p. ej. build/SSR)
}

// Auth API
export const loginApi = (username: string, password: string) =>
  api.post<{ token: string; user: AuthUser }>('/auth/login/', { username, password });

export const getMe = () => api.get<{ user: AuthUser }>('/auth/me/');

/** URL completa para una imagen de producto devuelta por la API (ej. /media/productos/xxx.jpg) */
export const getImagenProductoUrl = (imagenPath: string | null | undefined): string => {
  if (!imagenPath) return '';
  return imagenPath.startsWith('http') ? imagenPath : `${MEDIA_BASE}${imagenPath}`;
};

// Categorías
export const getCategorias = () => api.get('/categorias/');
export const getCategoria = (id: number) => api.get(`/categorias/${id}/`);
export const createCategoria = (data: { nombre: string; descripcion?: string }) =>
  api.post('/categorias/', data);
export const updateCategoria = (id: number, data: { nombre?: string; descripcion?: string }) =>
  api.patch(`/categorias/${id}/`, data);
export const deleteCategoria = (id: number) => api.delete(`/categorias/${id}/`);

// Productos
export interface ProductoPayload {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  categoria?: number | null;
  precio_venta?: number;
  stock_actual?: number;
  stock_minimo?: number;
  unidad_medida?: string;
  activo?: boolean;
}

export const getProductos = (params?: {
  categoria?: number;
  activo?: boolean;
  search?: string;
}) => api.get('/productos/', { params });
export const getProducto = (id: number) => api.get(`/productos/${id}/`);
export const getDashboard = () => api.get('/productos/dashboard/');

/** Top 10 productos más vendidos (solo admin). */
export interface TopVentaItem {
  id: number;
  codigo: string;
  nombre: string;
  precio_venta: string;
  total_vendido: number;
}
export const getTopVentas = () => api.get<TopVentaItem[]>('/productos/top_ventas/');

/** Importe de ventas por mes (solo admin). Últimos 12 meses. */
export interface VentasPorMesItem {
  anio: number;
  mes: number;
  mes_label: string;
  importe: number;
}
export const getVentasPorMes = () => api.get<VentasPorMesItem[]>('/productos/ventas_por_mes/');

function buildProductoFormData(data: ProductoPayload, imagen?: File): FormData {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'imagen') {
      form.append(key, typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value));
    }
  });
  if (imagen) form.append('imagen', imagen);
  return form;
}

export const createProducto = (data: ProductoPayload, imagen?: File) => {
  if (imagen) {
    const form = buildProductoFormData(data, imagen);
    return api.post('/productos/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.post('/productos/', data);
};

export const updateProducto = (
  id: number,
  data: ProductoPayload,
  imagen?: File | null,
  removerImagen?: boolean
) => {
  if (removerImagen) {
    return api.patch(`/productos/${id}/`, { ...data, imagen: null });
  }
  if (imagen) {
    const form = buildProductoFormData(data, imagen);
    return api.patch(`/productos/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.patch(`/productos/${id}/`, data);
};

export const deleteProducto = (id: number) => api.delete(`/productos/${id}/`);

// Movimientos
export const getMovimientos = () => api.get('/movimientos/');
export const createMovimiento = (data: {
  producto: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo?: string;
  responsable?: string;
}) => api.post('/movimientos/', data);

// Reportes de venta (vendedor envía, admin aprueba)
export interface ReporteVentaLineaItem {
  producto: number;
  cantidad: number;
}

export interface ReporteVenta {
  id: number;
  fecha: string;
  vendedor: number;
  vendedor_username: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  observaciones: string;
  aprobado_por: number | null;
  aprobado_en: string | null;
  creado_en: string;
  lineas: {
    id: number;
    producto: number;
    producto_codigo: string;
    producto_nombre: string;
    cantidad: number;
  }[];
}

export const getReportes = (estado?: 'pendiente' | 'aprobado' | 'rechazado') =>
  api.get<ReporteVenta[]>('/reportes/', estado ? { params: { estado } } : {});
export const getReporte = (id: number) => api.get<ReporteVenta>(`/reportes/${id}/`);
export const createReporte = (data: { fecha: string; lineas: ReporteVentaLineaItem[] }) =>
  api.post<ReporteVenta>('/reportes/', data);
export const aprobarReporte = (id: number) => api.post<ReporteVenta>(`/reportes/${id}/aprobar/`);
export const rechazarReporte = (id: number, observaciones?: string) =>
  api.post<ReporteVenta>(`/reportes/${id}/rechazar/`, { observaciones: observaciones || '' });

// Vendedores (solo admin: listar y crear)
export interface Vendedor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  date_joined: string;
}
export const getVendedores = () => api.get<Vendedor[]>('/vendedores/');
export const getVendedor = (id: number) => api.get<Vendedor>(`/vendedores/${id}/`);
export const createVendedor = (data: {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}) => api.post<Vendedor>('/vendedores/', data);
export const updateVendedor = (id: number, data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
  password?: string;
}) => api.patch<Vendedor>(`/vendedores/${id}/`, data);
export const deleteVendedor = (id: number) => api.delete(`/vendedores/${id}/`);
