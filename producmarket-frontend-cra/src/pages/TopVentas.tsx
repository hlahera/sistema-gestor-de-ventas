import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getTopVentas, type TopVentaItem } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { ResponsiveTableWrap } from '../components/ui/ResponsiveTableWrap';
import { hideOnMobile, pageContentSx } from '../styles/responsive';

const TopVentas: React.FC = () => {
  const [data, setData] = useState<TopVentaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTopVentas()
      .then((res) => setData(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={pageContentSx}>
      <PageHeader
        title="Top 10 más vendidos"
        subtitle="Productos ordenados por cantidad total vendida (movimientos de salida)."
        action={<TrendingUpIcon color="primary" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 32 }} />}
      />

      {error && (
        <Box sx={{ color: 'error.main', mb: 2 }}>{error}</Box>
      )}

      <DataCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={280} />
          </Box>
        ) : (
          <ResponsiveTableWrap>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell sx={hideOnMobile}>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right" sx={hideOnMobile}>
                      Precio
                    </TableCell>
                    <TableCell align="right">Vendidos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        Aún no hay ventas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, index) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={hideOnMobile}>{row.codigo}</TableCell>
                        <TableCell>
                          <Box component="span" sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                            {row.codigo}
                          </Box>
                          {row.nombre}
                        </TableCell>
                        <TableCell align="right" sx={hideOnMobile}>
                          {new Intl.NumberFormat('es-CL', {
                            style: 'currency',
                            currency: 'CLP',
                          }).format(Number(row.precio_venta))}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {row.total_vendido}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </ResponsiveTableWrap>
        )}
      </DataCard>
    </Box>
  );
};

export default TopVentas;
