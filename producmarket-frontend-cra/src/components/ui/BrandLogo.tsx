import React from 'react';
import { Box, Typography } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

type BrandLogoProps = {
  compact?: boolean;
  light?: boolean;
};

export function BrandLogo({ compact = false, light = false }: BrandLogoProps) {
  const fg = light ? '#F8FAFC' : 'text.primary';
  const sub = light ? 'rgba(248, 250, 252, 0.65)' : 'text.secondary';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Box
        sx={{
          width: compact ? 36 : 40,
          height: compact ? 36 : 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (t) =>
            light
              ? 'linear-gradient(135deg, #3B82F6 0%, #0D9488 100%)'
              : `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.secondary.main} 100%)`,
          boxShadow: light
            ? '0 8px 24px rgba(37, 99, 235, 0.35)'
            : '0 4px 14px rgba(37, 99, 235, 0.22)',
          flexShrink: 0,
        }}
      >
        <StorefrontOutlinedIcon sx={{ color: '#fff', fontSize: compact ? 20 : 22 }} />
      </Box>
      {!compact && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: fg,
            }}
          >
            ProducMarket
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: sub, lineHeight: 1.2, display: 'block' }}
          >
            Inventario & ventas
          </Typography>
        </Box>
      )}
    </Box>
  );
}
