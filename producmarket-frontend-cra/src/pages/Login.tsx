import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { loginApi, setStoredAuth } from '../api/client';

const Login: React.FC = () => {
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
      setStoredAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Error al iniciar sesión';
      setError(msg || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" align="center" gutterBottom color="primary">
            🛒 ProducMarket
          </Typography>
          
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
            Sistema de Gestión de Productos
          </Typography>
          
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            Tesis: Ingeniería en Ciencias Informáticas
          </Typography>

          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              variant="outlined"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
              }}
            >
              {loading ? 'Entrando...' : 'Ingresar al Sistema'}
            </Button>
          </form>

          <Typography variant="caption" display="block" align="center" color="textSecondary">
            Usa un usuario del sistema (creado en Django / admin)
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;