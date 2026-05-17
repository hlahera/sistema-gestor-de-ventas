import React from 'react';
import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'primary' | 'warning' | 'success' | 'secondary';
};

export function StatCard({ label, value, icon, accent = 'primary' }: StatCardProps) {
  const theme = useTheme();
  const paletteKey = accent === 'primary' ? 'primary' : accent;
  const color = theme.palette[paletteKey].main;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, 0.1),
          color,
          flexShrink: 0,
          '& .MuiSvgIcon-root': { fontSize: 26 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
