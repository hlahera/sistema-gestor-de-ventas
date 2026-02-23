export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  productos_count?: number;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: number | null;
  categoria_nombre?: string;
  precio_venta: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  imagen?: string | null;
  activo: boolean;
  bajo_stock?: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface MovimientoInventario {
  id: number;
  producto: number;
  producto_nombre: string;
  producto_codigo: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  responsable?: string;
  fecha: string;
}

export interface DashboardData {
  total_productos: number;
  productos_bajo_stock: number;
  valor_inventario: number;
  ultimos_movimientos: MovimientoInventario[];
}
