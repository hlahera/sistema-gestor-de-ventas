/**
 * Contexto para modo offline: estado de conexión y sincronización.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getPendientes,
  removePendiente,
  saveProductos,
  saveCategorias,
  saveMovimientos,
} from './db';
import { getProductos, getCategorias, getMovimientos, createMovimiento } from '../api/client';

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  sync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) return null;
  return ctx;
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    const pendientes = await getPendientes();
    setPendingCount(pendientes.length);
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const pendientes = await getPendientes();
      for (const p of pendientes) {
        try {
          await createMovimiento({
            producto: p.producto,
            tipo: p.tipo,
            cantidad: p.cantidad,
            motivo: p.motivo,
            responsable: p.responsable,
          });
          await removePendiente(p.id);
        } catch (e) {
          console.warn('Error sincronizando movimiento:', p, e);
          break;
        }
      }
      const [productosRes, categoriasRes, movRes] = await Promise.all([
        getProductos().catch(() => ({ data: [] })),
        getCategorias().catch(() => ({ data: [] })),
        getMovimientos().catch(() => ({ data: [] })),
      ]);
      await Promise.all([
        saveProductos(productosRes.data),
        saveCategorias(categoriasRes.data),
        saveMovimientos(movRes.data),
      ]);
      await updatePendingCount();
      window.dispatchEvent(new CustomEvent('producmarket-synced'));
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync]);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount, isOnline]);

  const value: OfflineContextValue = {
    isOnline,
    isSyncing,
    pendingCount,
    sync,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}
