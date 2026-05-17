import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BrandLogo } from './BrandLogo';

export function AppLoading() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        bgcolor: 'background.default',
      }}
    >
      <BrandLogo />
      <CircularProgress size={32} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        Cargando…
      </Typography>
    </Box>
  );
}
