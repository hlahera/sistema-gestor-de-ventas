/**
 * API con soporte offline: usa caché local cuando no hay conexión.
 */
import {
  getProductos,
  getCategorias,
  getMovimientos,
  createMovimiento,
  getDashboard,
} from './client';
import {
  getProductosFromCache,
  saveProductos,
  getCategoriasFromCache,
  saveCategorias,
  getMovimientosFromCache,
  saveMovimientos,
  getPendientes,
  addPendiente,
} from '../offline/db';

export { getImagenProductoUrl } from './client';
export type { ProductoPayload } from './client';

export async function getProductosOffline(params?: {
  categoria?: number;
  activo?: boolean;
  search?: string;
}) {
  if (navigator.onLine) {
    const res = await getProductos(params);
    saveProductos(res.data).catch(console.warn);
    return res;
  }
  let productos = (await getProductosFromCache()) as Record<string, unknown>[];
  if (params?.categoria != null) {
    const catId = Number(params.categoria);
    productos = productos.filter((p) => Number(p.categoria) === catId);
  }
  if (params?.search?.trim()) {
    const q = String(params.search).toLowerCase().trim();
    productos = productos.filter(
      (p) =>
        String(p.nombre || '').toLowerCase().includes(q) ||
        String(p.codigo || '').toLowerCase().includes(q) ||
        String(p.categoria_nombre || '').toLowerCase().includes(q)
    );
  }
  if (params?.activo !== undefined) {
    productos = productos.filter((p) => p.activo === params.activo);
  }
  return { data: productos };
}

export async function getCategoriasOffline() {
  if (navigator.onLine) {
    const res = await getCategorias();
    saveCategorias(res.data).catch(console.warn);
    return res;
  }
  const data = await getCategoriasFromCache();
  return { data };
}

function fechaLocalYmd(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function movimientoEnFecha(m: { fecha: string }, fechaYmd: string | undefined): boolean {
  if (!fechaYmd) return true;
  return fechaLocalYmd(m.fecha) === fechaYmd;
}

export async function getMovimientosOffline(params?: { fecha?: string }) {
  const fecha = params?.fecha?.trim() || undefined;
  if (navigator.onLine) {
    const res = await getMovimientos(fecha ? { fecha } : undefined);
    // No pisar la caché con un subconjunto filtrado
    if (!fecha) {
      saveMovimientos(res.data).catch(console.warn);
    }
    return res;
  }
  const data = (await getMovimientosFromCache()) as object[];
  const base = fecha ? data.filter((m) => movimientoEnFecha(m as { fecha: string }, fecha)) : data;
  const pendientes = await getPendientes();
  const pendientesAsMov = pendientes
    .map((p) => ({
      id: p.id,
      producto: p.producto,
      producto_nombre: '(pendiente de sincronización)',
      producto_codigo: '-',
      tipo: p.tipo,
      cantidad: p.cantidad,
      motivo: p.motivo || '',
      responsable: p.responsable || '',
      fecha: new Date(p.createdAt).toISOString(),
      _pending: true,
    }))
    .filter((m) => movimientoEnFecha(m, fecha));
  return { data: [...pendientesAsMov, ...base] };
}

export async function createMovimientoOffline(data: {
  producto: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo?: string;
  responsable?: string;
}) {
  if (navigator.onLine) {
    return createMovimiento(data);
  }
  await addPendiente(data);
  return { data: { ok: true } };
}

export async function getDashboardOffline() {
  if (navigator.onLine) {
    const res = await getDashboard();
    return res;
  }
  const productos = (await getProductosFromCache()) as Record<string, unknown>[];
  const movimientos = await getMovimientosFromCache();
  const pendientes = await getPendientes();
  const activos = productos.filter((p) => p.activo !== false);
  const total_productos = activos.length;
  const productos_bajo_stock = activos.filter((p) => {
    const stock = Number(p.stock_actual) || 0;
    const min = Number(p.stock_minimo) || 0;
    return min > 0 && stock <= min;
  }).length;
  const valor_inventario = activos.reduce(
    (sum, p) =>
      sum + (Number(p.stock_actual) || 0) * (Number(p.precio_venta) || 0),
    0
  );
  const ultimos_movimientos = [
    ...pendientes.map((p) => ({
      id: p.id,
      producto_nombre: '(pendiente)',
      producto_codigo: '-',
      tipo: p.tipo,
      cantidad: p.cantidad,
      motivo: p.motivo || '',
      responsable: p.responsable || '',
      fecha: new Date(p.createdAt).toISOString(),
    })),
    ...(movimientos as Record<string, unknown>[]).slice(0, 10 - pendientes.length),
  ].slice(0, 10);
  return {
    data: {
      total_productos,
      productos_bajo_stock,
      valor_inventario,
      ultimos_movimientos,
    },
  };
}
