import type { SxProps, Theme } from '@mui/material/styles';

/** Oculta celda/columna en móvil (< sm, 600px) */
export const hideOnMobile: SxProps<Theme> = {
  display: { xs: 'none', sm: 'table-cell' },
};

/** Oculta en móvil y tablet pequeña (< md, 900px) */
export const hideOnTablet: SxProps<Theme> = {
  display: { xs: 'none', md: 'table-cell' },
};

/** Padding horizontal con safe-area (notch / barra home iOS) */
export const safeAreaPaddingX: SxProps<Theme> = {
  pl: 'max(16px, env(safe-area-inset-left))',
  pr: 'max(16px, env(safe-area-inset-right))',
};

export const pageContentSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  overflowX: 'hidden',
};

/** Props estándar para diálogos en móvil */
export function dialogResponsiveProps(isMobile: boolean) {
  return {
    fullScreen: isMobile,
    fullWidth: true,
    maxWidth: 'sm' as const,
    scroll: 'paper' as const,
  };
}
