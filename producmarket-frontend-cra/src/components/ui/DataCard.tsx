import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

type DataCardProps = {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
};

export function DataCard({ title, action, children, noPadding }: DataCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            display: 'flex',
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(15, 23, 42, 0.02)',
          }}
        >
          {title && (
            <Typography variant="subtitle1" component="h2">
              {title}
            </Typography>
          )}
          {action}
        </Box>
      )}
      <Box sx={noPadding ? undefined : { p: 0 }}>{children}</Box>
    </Paper>
  );
}
