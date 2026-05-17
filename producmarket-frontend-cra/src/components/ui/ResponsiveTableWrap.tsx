import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import SwipeRightAltIcon from '@mui/icons-material/SwipeRightAlt';
import useMediaQuery from '@mui/material/useMediaQuery';

type ResponsiveTableWrapProps = {
  children: React.ReactNode;
  /** Muestra hint “desliza” solo en pantallas estrechas */
  showScrollHint?: boolean;
};

/**
 * Contenedor para tablas anchas: scroll horizontal táctil sin romper el layout.
 */
export function ResponsiveTableWrap({ children, showScrollHint = true }: ResponsiveTableWrapProps) {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {showScrollHint && isNarrow && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 1,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            color: 'text.secondary',
          }}
        >
          <SwipeRightAltIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Desliza horizontalmente para ver todas las columnas
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          mx: -0.5,
          px: 0.5,
          '& table': {
            minWidth: 'max-content',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
