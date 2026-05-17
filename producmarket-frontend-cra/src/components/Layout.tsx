import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  Chip,
  Alert,
  IconButton,
  useMediaQuery,
  Tooltip,
  Avatar,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SyncIcon from '@mui/icons-material/Sync';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportIcon from '@mui/icons-material/Report';
import PeopleIcon from '@mui/icons-material/People';
import { useOffline } from '../offline/OfflineContext';
import { useAuth } from '../auth/AuthContext';
import { type AuthUser } from '../api/client';
import { clearLocalAppData } from '../api/client';
import { BrandLogo } from './ui/BrandLogo';
import { sidebarTokens } from '../theme';

const menuItemsAdmin = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { path: '/productos', label: 'Productos', icon: <Inventory2Icon fontSize="small" /> },
  { path: '/categorias', label: 'Categorías', icon: <CategoryIcon fontSize="small" /> },
  { path: '/movimientos', label: 'Movimientos', icon: <SwapHorizIcon fontSize="small" /> },
  { path: '/top-ventas', label: 'Top ventas', icon: <TrendingUpIcon fontSize="small" /> },
  { path: '/reportes', label: 'Reportes', icon: <AssignmentIcon fontSize="small" /> },
  { path: '/vendedores', label: 'Vendedores', icon: <PeopleIcon fontSize="small" /> },
];

const menuItemsVendedor = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { path: '/productos', label: 'Productos', icon: <Inventory2Icon fontSize="small" /> },
  { path: '/movimientos', label: 'Movimientos', icon: <SwapHorizIcon fontSize="small" /> },
  { path: '/reportar-ventas', label: 'Reportar ventas', icon: <ReportIcon fontSize="small" /> },
];

function getMenuItems(tipo: AuthUser['tipo']) {
  return tipo === 'admin' ? menuItemsAdmin : menuItemsVendedor;
}

function userDisplayName(user: AuthUser): string {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return full || user.username;
}

function userInitials(user: AuthUser): string {
  const name = userDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const offline = useOffline();
  const { user, logout } = useAuth();
  const menuItems = user ? getMenuItems(user.tipo) : menuItemsVendedor;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    clearLocalAppData().catch(() => {});
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobileDrawer = () => setMobileOpen(false);
  const toggleMobileDrawer = () => setMobileOpen((v) => !v);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const offlineChipLabel = offline
    ? offline.isOnline
      ? offline.isSyncing
        ? 'Sincronizando…'
        : offline.pendingCount
          ? `${offline.pendingCount} pendiente(s)`
          : 'En línea'
      : 'Sin conexión'
    : '';

  const drawerPaperSx = {
    width: { xs: 'min(100vw, 300px)', md: sidebarTokens.width },
    maxWidth: '100vw',
    boxSizing: 'border-box' as const,
    bgcolor: sidebarTokens.bg,
    color: sidebarTokens.text,
    borderRight: `1px solid ${sidebarTokens.border}`,
  };

  const navList = (
    <List sx={{ px: 0.5, py: 1, flex: 1 }}>
      <Typography
        variant="caption"
        sx={{
          px: 2.5,
          py: 1,
          display: 'block',
          color: 'rgba(248, 250, 252, 0.45)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.65rem',
        }}
      >
        Menú principal
      </Typography>
      {menuItems.map((item) => {
        const selected =
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        return (
          <ListItemButton
            key={item.path}
            selected={selected}
            onClick={() => {
              navigate(item.path);
              closeMobileDrawer();
            }}
            sx={{
              color: selected ? sidebarTokens.textActive : sidebarTokens.text,
              '&.Mui-selected': {
                bgcolor: sidebarTokens.selectedBg,
                color: sidebarTokens.textActive,
                borderLeft: `3px solid ${sidebarTokens.selectedBorder}`,
                pl: '13px',
                '& .MuiListItemIcon-root': { color: '#93C5FD' },
              },
              '&:hover': {
                bgcolor: sidebarTokens.bgHover,
                color: sidebarTokens.textActive,
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: selected ? 700 : 500,
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  const drawerFooter = user && (
    <Box
      sx={{
        p: 2,
        borderTop: `1px solid ${sidebarTokens.border}`,
        bgcolor: 'rgba(0,0,0,0.15)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: '0.875rem',
            fontWeight: 700,
            bgcolor: 'primary.main',
          }}
        >
          {userInitials(user)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: sidebarTokens.textActive, fontWeight: 700 }}
          >
            {userDisplayName(user)}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: sidebarTokens.text }}>
            {user.tipo === 'admin' ? 'Administrador' : 'Vendedor'}
          </Typography>
        </Box>
      </Box>
      <Button
        fullWidth
        size="small"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        sx={{
          color: sidebarTokens.text,
          borderColor: sidebarTokens.border,
          justifyContent: 'flex-start',
          '&:hover': {
            bgcolor: sidebarTokens.bgHover,
            borderColor: 'rgba(248,250,252,0.2)',
          },
        }}
        variant="outlined"
      >
        Cerrar sesión
      </Button>
    </Box>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 2.5, borderBottom: `1px solid ${sidebarTokens.border}` }}>
        <BrandLogo light />
      </Box>
      {navList}
      {isDesktop && drawerFooter}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          ml: { md: `${sidebarTokens.width}px` },
          width: { md: `calc(100% - ${sidebarTokens.width}px)` },
        }}
      >
        <Toolbar
          sx={{
            gap: 1,
            minHeight: { xs: 56, sm: 64 },
            pt: 'env(safe-area-inset-top)',
          }}
        >
          {!isDesktop && (
            <IconButton edge="start" onClick={toggleMobileDrawer} aria-label="Abrir menú">
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
              {menuItems.find(
                (m) =>
                  location.pathname === m.path ||
                  (m.path !== '/dashboard' && location.pathname.startsWith(m.path))
              )?.label || 'Panel'}
            </Typography>
          </Box>
          {offline && (
            <Tooltip title={offlineChipLabel}>
              <Chip
                size="small"
                variant="outlined"
                icon={
                  offline.isOnline ? (
                    offline.isSyncing ? (
                      <SyncIcon />
                    ) : (
                      <CloudQueueIcon />
                    )
                  ) : (
                    <CloudOffIcon />
                  )
                }
                label={offlineChipLabel}
                color={offline.isOnline ? 'success' : 'warning'}
                onClick={offline.isOnline && offline.pendingCount ? offline.sync : undefined}
                sx={{
                  maxWidth: { xs: 40, sm: 'none' },
                  '& .MuiChip-label': { display: { xs: 'none', sm: 'inline' } },
                }}
              />
            </Tooltip>
          )}
          {user?.tipo === 'admin' && (
            <Chip
              size="small"
              icon={<AdminPanelSettingsIcon />}
              label="Admin"
              color="primary"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
          )}
          {!isDesktop && user && (
            <IconButton onClick={handleLogout} aria-label="Cerrar sesión" size="small">
              <LogoutIcon fontSize="small" />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={!isDesktop && mobileOpen}
        onClose={closeMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            ...drawerPaperSx,
            // Debajo del AppBar fijo para que no tape el logo ProducMarket
            top: 'calc(56px + env(safe-area-inset-top, 0px))',
            height: 'calc(100% - 56px - env(safe-area-inset-top, 0px))',
            '@media (min-width:600px)': {
              top: 'calc(64px + env(safe-area-inset-top, 0px))',
              height: 'calc(100% - 64px - env(safe-area-inset-top, 0px))',
            },
          },
        }}
      >
        {drawerContent}
        {!isDesktop && drawerFooter}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarTokens.width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            ...drawerPaperSx,
            top: 0,
            height: '100%',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${sidebarTokens.width}px)` },
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box
          sx={{
            flex: 1,
            px: {
              xs: 'max(16px, env(safe-area-inset-left))',
              sm: 3,
              lg: 4,
            },
            pr: {
              xs: 'max(16px, env(safe-area-inset-right))',
              sm: 3,
              lg: 4,
            },
            py: { xs: 2, sm: 3 },
            pb: {
              xs: 'max(16px, env(safe-area-inset-bottom))',
              sm: 3,
            },
            maxWidth: 1400,
            width: '100%',
            mx: 'auto',
            minWidth: 0,
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {offline && !offline.isOnline && (
            <Alert severity="info" sx={{ mb: 3 }} variant="outlined">
              Modo offline: consultando datos en caché. Los movimientos pendientes se sincronizarán
              al recuperar la conexión.
            </Alert>
          )}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
