import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { loginApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from '../components/ui/BrandLogo';

type LoginFormProps = {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onErrorClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  variant?: 'mobile' | 'desktop';
};

function LoginForm({
  username,
  password,
  loading,
  error,
  onUsernameChange,
  onPasswordChange,
  onErrorClose,
  onSubmit,
  variant = 'desktop',
}: LoginFormProps) {
  const theme = useTheme();
  const isMobile = variant === 'mobile';

  const fieldSx = isMobile
    ? {
        '& .MuiOutlinedInput-root': {
          bgcolor: '#F8FAFC',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { bgcolor: '#F1F5F9' },
          '&.Mui-focused': {
            bgcolor: '#FFFFFF',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
          },
        },
      }
    : undefined;

  return (
    <Stack spacing={isMobile ? 2.5 : 3}>
      {isMobile ? (
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #3B82F6 0%, #0D9488 100%)',
              boxShadow: '0 12px 32px rgba(37, 99, 235, 0.35)',
            }}
          >
            <StorefrontOutlinedIcon sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'text.primary' }}
          >
            ProducMarket
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Iniciar sesión
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', lineHeight: 1.5, maxWidth: 280, mt: 0.25 }}
          >
            Inventario, movimientos y reportes de venta en un solo lugar.
          </Typography>
        </Stack>
      ) : (
        <Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              mb: 2,
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>
            Iniciar sesión
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Introduce tus credenciales para acceder al panel.
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" variant="outlined" onClose={onErrorClose} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={isMobile ? 1.75 : 2}>
          <TextField
            required
            fullWidth
            label="Usuario"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoFocus={!isMobile}
            autoComplete="username"
            sx={fieldSx}
          />
          <TextField
            required
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
            sx={fieldSx}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              mt: isMobile ? 0.5 : 0.5,
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: 2.5,
              ...(isMobile && {
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)',
                boxShadow: '0 10px 28px rgba(37, 99, 235, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
                  boxShadow: '0 12px 32px rgba(37, 99, 235, 0.45)',
                },
                '&.Mui-disabled': {
                  background: alpha(theme.palette.primary.main, 0.4),
                  color: '#fff',
                },
              }),
            }}
          >
            {loading ? 'Entrando…' : isMobile ? 'Entrar' : 'Acceder al panel'}
          </Button>
        </Stack>
      </Box>

      {isMobile ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', display: 'block', pt: 0.5, opacity: 0.85 }}
        >
          © 2026 ProducMarket
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          © 2026 ProducMarket
        </Typography>
      )}
    </Stack>
  );
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await loginApi(username, password);
      login(data.token, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let msg = 'Error al iniciar sesión';
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as {
          response?: { status?: number; data?: { detail?: unknown } };
          message?: string;
        };
        const d = ax.response?.data?.detail;
        if (typeof d === 'string') msg = d;
        else if (Array.isArray(d)) msg = d.join(' ');
        else if (!ax.response) {
          msg = ax.message?.includes('Network')
            ? 'No hay conexión con el servidor. Espera 1 minuto (el API puede estar despertando) y recarga.'
            : `${msg}${ax.message ? `: ${ax.message}` : ''}`;
        } else if (ax.response?.status === 400) {
          msg = 'El servidor rechazó la petición. Si acabas de desplegar, espera 2 minutos y vuelve a intentar.';
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formProps = {
    username,
    password,
    loading,
    error,
    onUsernameChange: setUsername,
    onPasswordChange: setPassword,
    onErrorClose: () => setError(null),
    onSubmit: handleSubmit,
  };

  return (
    <>
      {/* Móvil: tarjeta centrada sobre fondo premium */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          px: 2.5,
          py: 3,
          pt: 'max(20px, env(safe-area-inset-top))',
          pb: 'max(20px, env(safe-area-inset-bottom))',
          position: 'relative',
          overflow: 'hidden',
          background: `
            radial-gradient(ellipse 90% 60% at 50% -15%, ${alpha('#3B82F6', 0.45)} 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 100% 50%, ${alpha('#0D9488', 0.2)} 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 0% 80%, ${alpha('#6366F1', 0.15)} 0%, transparent 45%),
            linear-gradient(165deg, #0F172A 0%, #1E293B 38%, #F1F5F9 38%, #F8FAFC 100%)
          `,
        }}
      >
        {/* Orbes decorativos */}
        <Box
          sx={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: alpha('#3B82F6', 0.12),
            filter: 'blur(60px)',
            top: '-8%',
            right: '-20%',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: alpha('#14B8A6', 0.1),
            filter: 'blur(50px)',
            bottom: '15%',
            left: '-15%',
            pointerEvents: 'none',
          }}
        />

        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 400,
            p: { xs: 3, sm: 3.5 },
            borderRadius: 4,
            bgcolor: '#FFFFFF',
            boxShadow: `
              0 0 0 1px ${alpha('#0F172A', 0.04)},
              0 24px 48px ${alpha('#0F172A', 0.12)},
              0 8px 16px ${alpha('#0F172A', 0.06)}
            `,
          }}
        >
          <LoginForm {...formProps} variant="mobile" />
        </Paper>
      </Box>

      {/* Escritorio */}
      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: '1fr 1fr',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 8,
            py: 6,
            background: 'linear-gradient(145deg, #0F172A 0%, #1E3A8A 45%, #0D9488 100%)',
            color: '#F8FAFC',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: alpha('#FFFFFF', 0.06),
              top: -120,
              right: -80,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: alpha('#FFFFFF', 0.04),
              bottom: -60,
              left: -40,
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
            <BrandLogo light />
            <Typography
              variant="h3"
              sx={{
                mt: 5,
                mb: 2,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                fontSize: { md: '2.25rem', lg: '2.75rem' },
              }}
            >
              Control total de tu inventario
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#F8FAFC', 0.78), lineHeight: 1.7 }}>
              Gestiona productos, movimientos y reportes de ventas desde un panel claro y seguro,
              pensado para equipos de retail y distribución.
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 5 }}>
              {['Stock en tiempo real', 'Reportes de vendedores', 'Modo offline'].map((t) => (
                <Typography
                  key={t}
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: alpha('#F8FAFC', 0.9),
                    borderLeft: `2px solid ${alpha('#FFFFFF', 0.35)}`,
                    pl: 1.5,
                  }}
                >
                  {t}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 6,
          }}
        >
          <Container maxWidth="sm" disableGutters sx={{ width: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 16px 48px rgba(15, 23, 42, 0.08)',
              }}
            >
              <LoginForm {...formProps} variant="desktop" />
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default Login;
