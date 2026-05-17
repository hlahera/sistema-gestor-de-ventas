import { alpha, createTheme } from '@mui/material/styles';

const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
};

/** Tema MUI — estilo panel SaaS profesional */
export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1D4ED8',
      light: '#3B82F6',
      dark: '#1E3A8A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0D9488',
      light: '#14B8A6',
      dark: '#0F766E',
      contrastText: '#FFFFFF',
    },
    success: { main: '#059669' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    background: {
      default: slate[100],
      paper: '#FFFFFF',
    },
    text: {
      primary: slate[900],
      secondary: '#64748B',
    },
    divider: alpha(slate[900], 0.08),
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      '"Plus Jakarta Sans"',
      'Inter',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h5: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.25 },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600 },
    body2: { lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          overflowX: 'hidden',
        },
        body: {
          WebkitTapHighlightColor: 'transparent',
          scrollbarColor: `${alpha(slate[900], 0.2)} transparent`,
          overflowX: 'hidden',
          minHeight: '100vh',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '#root': {
          minHeight: '100vh',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#FFFFFF', 0.85),
          backdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: `1px solid ${alpha(slate[900], 0.08)}`,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingLeft: 18,
          paddingRight: 18,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)`,
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filled: {
          border: '1px solid transparent',
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(slate[900], 0.25),
          },
        },
        notchedOutline: {
          borderColor: alpha(slate[900], 0.12),
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 10px',
          paddingTop: 10,
          paddingBottom: 10,
          '&.Mui-selected': {
            backgroundColor: alpha('#3B82F6', 0.14),
            color: '#1D4ED8',
            '&:hover': {
              backgroundColor: alpha('#3B82F6', 0.2),
            },
            '& .MuiListItemIcon-root': {
              color: '#1D4ED8',
            },
          },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'inherit',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: 16,
          borderRadius: 16,
          border: `1px solid ${alpha(slate[900], 0.08)}`,
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.14)',
          '@media (max-width:599.95px)': {
            margin: 8,
            width: 'calc(100% - 16px)',
            maxWidth: 'calc(100% - 16px) !important',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          WebkitOverflowScrolling: 'touch',
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(slate[900], 0.025),
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: alpha(slate[900], 0.65),
          borderBottom: `1px solid ${alpha(slate[900], 0.08)}`,
          py: 1.5,
        },
        body: {
          borderBottom: `1px solid ${alpha(slate[900], 0.06)}`,
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
          '&:hover': {
            backgroundColor: alpha(slate[900], 0.02),
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
        standardInfo: {
          backgroundColor: alpha('#2563EB', 0.08),
          color: slate[900],
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

/** Colores del sidebar oscuro (fuera del palette MUI estándar) */
export const sidebarTokens = {
  width: 260,
  bg: slate[900],
  bgHover: alpha('#FFFFFF', 0.06),
  text: alpha('#F8FAFC', 0.72),
  textActive: '#FFFFFF',
  border: alpha('#FFFFFF', 0.08),
  selectedBg: alpha('#3B82F6', 0.18),
  selectedBorder: '#3B82F6',
};
