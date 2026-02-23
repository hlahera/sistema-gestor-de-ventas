/**
 * IndexedDB para modo offline: caché de productos/categorías y cola de movimientos pendientes.
 */
const DB_NAME = 'producmarket-offline';
const DB_VERSION = 1;
const STORE_PRODUCTOS = 'productos';
const STORE_CATEGORIAS = 'categorias';
const STORE_MOVIMIENTOS = 'movimientos';
const STORE_PENDIENTES = 'pendientes';

export interface PendingMovimiento {
  id: string;
  producto: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo?: string;
  responsable?: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTOS)) {
        db.createObjectStore(STORE_PRODUCTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIAS)) {
        db.createObjectStore(STORE_CATEGORIAS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MOVIMIENTOS)) {
        db.createObjectStore(STORE_MOVIMIENTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PENDIENTES)) {
        db.createObjectStore(STORE_PENDIENTES, { keyPath: 'id' });
      }
    };
  });
}

export async function saveProductos(productos: unknown[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PRODUCTOS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTOS);
    store.clear();
    productos.forEach((p) => store.put(p));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getProductosFromCache(): Promise<unknown[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PRODUCTOS, 'readonly');
    const req = tx.objectStore(STORE_PRODUCTOS).getAll();
    req.onsuccess = () => {
      db.close();
      resolve(req.result || []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function saveCategorias(categorias: unknown[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIAS, 'readwrite');
    const store = tx.objectStore(STORE_CATEGORIAS);
    store.clear();
    categorias.forEach((c) => store.put(c));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getCategoriasFromCache(): Promise<unknown[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIAS, 'readonly');
    const req = tx.objectStore(STORE_CATEGORIAS).getAll();
    req.onsuccess = () => {
      db.close();
      resolve(req.result || []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function addPendiente(data: Omit<PendingMovimiento, 'id' | 'createdAt'>): Promise<void> {
  const db = await openDB();
  const item: PendingMovimiento = {
    ...data,
    id: `pendiente-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDIENTES, 'readwrite');
    tx.objectStore(STORE_PENDIENTES).add(item);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getPendientes(): Promise<PendingMovimiento[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDIENTES, 'readonly');
    const req = tx.objectStore(STORE_PENDIENTES).getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result || []).sort((a, b) => a.createdAt - b.createdAt));
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function removePendiente(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDIENTES, 'readwrite');
    tx.objectStore(STORE_PENDIENTES).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveMovimientos(movimientos: unknown[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MOVIMIENTOS, 'readwrite');
    const store = tx.objectStore(STORE_MOVIMIENTOS);
    store.clear();
    movimientos.slice(0, 100).forEach((m) => store.put(m));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getMovimientosFromCache(): Promise<unknown[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MOVIMIENTOS, 'readonly');
    const req = tx.objectStore(STORE_MOVIMIENTOS).getAll();
    req.onsuccess = () => {
      db.close();
      resolve(req.result || []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}
