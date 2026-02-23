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
  Divider,
  useMediaQuery,
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
import { getStoredUser, clearStoredAuth, type AuthUser } from '../api/client';

const DRAWER_WIDTH = 240;

const menuItemsAdmin = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/productos', label: 'Productos', icon: <Inventory2Icon /> },
  { path: '/categorias', label: 'Categorías', icon: <CategoryIcon /> },
  { path: '/movimientos', label: 'Movimientos', icon: <SwapHorizIcon /> },
  { path: '/top-ventas', label: 'Top 10 más vendidos', icon: <TrendingUpIcon /> },
  { path: '/reportes', label: 'Reportes', icon: <AssignmentIcon /> },
  { path: '/vendedores', label: 'Vendedores', icon: <PeopleIcon /> },
];

const menuItemsVendedor = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/productos', label: 'Productos', icon: <Inventory2Icon /> },
  { path: '/movimientos', label: 'Movimientos', icon: <SwapHorizIcon /> },
  { path: '/reportar-ventas', label: 'Reportar ventas', icon: <ReportIcon /> },
];

function getMenuItems(tipo: AuthUser['tipo']) {
  return tipo === 'admin' ? menuItemsAdmin : menuItemsVendedor;
}

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const offline = useOffline(); // puede ser null si está fuera del Provider (Login)
  const user = getStoredUser();
  const menuItems = user ? getMenuItems(user.tipo) : menuItemsVendedor;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/');
  };

  const closeMobileDrawer = () => setMobileOpen(false);
  const toggleMobileDrawer = () => setMobileOpen((v) => !v);

  const drawerContent = (
    <Box sx={{ overflow: 'auto', pt: 1 }}>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              closeMobileDrawer();
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      {!isDesktop && <Divider />}
      {!isDesktop && (
        <List sx={{ pt: 0 }}>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {!isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleMobileDrawer}
              sx={{ mr: 1 }}
              aria-label="Abrir menú"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ProducMarket – Gestión de inventario
          </Typography>
          {offline && (
            <Chip
              size="small"
              icon={offline.isOnline ? (offline.isSyncing ? <SyncIcon /> : <CloudQueueIcon />) : <CloudOffIcon />}
              label={
                offline.isOnline
                  ? offline.isSyncing
                    ? 'Sincronizando...'
                    : offline.pendingCount
                    ? `${offline.pendingCount} pendiente(s)`
                    : 'En línea'
                  : 'Sin conexión'
              }
              color={offline.isOnline ? 'success' : 'warning'}
              sx={{ mr: 1 }}
              onClick={offline.isOnline && offline.pendingCount ? offline.sync : undefined}
            />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Typography variant="body2">{user?.username || 'Usuario'}</Typography>
            {user?.tipo === 'admin' && (
              <Chip
                size="small"
                icon={<AdminPanelSettingsIcon />}
                label="Admin"
                color="primary"
              />
            )}
          </Box>
          {isDesktop && (
            <ListItemButton onClick={handleLogout} sx={{ color: 'white', maxWidth: 48 }}>
              <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                <LogoutIcon />
              </ListItemIcon>
            </ListItemButton>
          )}
        </Toolbar>
      </AppBar>
      {/* Drawer móvil (temporal) */}
      <Drawer
        variant="temporary"
        open={!isDesktop && mobileOpen}
        onClose={closeMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer escritorio (permanente) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: 64,
            height: 'calc(100% - 64px)',
          },
        }}
        open
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          mt: 7,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {offline && !offline.isOnline && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Modo offline: consultando datos en caché. Las ventas registradas se sincronizarán
            automáticamente cuando se restablezca la conexión.
          </Alert>
        )}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
