from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db.utils import OperationalError, ProgrammingError
from rest_framework.authtoken.models import Token

from .models import PerfilUsuario

_DB_SCHEMA_HINT = (
    'Error de base de datos. Si actualizaste el proyecto, ejecuta en la carpeta del backend: '
    'python manage.py migrate'
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Autentica usuario y devuelve token + datos de usuario (incluye tipo: admin/vendedor)."""
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response(
            {'detail': 'Usuario y contraseña requeridos'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = authenticate(username=username, password=password)
    if not user:
        return Response(
            {'detail': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not user.is_active:
        return Response(
            {'detail': 'Usuario desactivado'},
            status=status.HTTP_403_FORBIDDEN,
        )
    token, _ = Token.objects.get_or_create(user=user)
    try:
        tipo = user.perfil.tipo
    except PerfilUsuario.DoesNotExist:
        tipo = 'vendedor'
    except (OperationalError, ProgrammingError):
        return Response({'detail': _DB_SCHEMA_HINT}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'tipo': tipo,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Devuelve el usuario actual con su tipo (para refrescar sesión en el frontend)."""
    user = request.user
    try:
        tipo = user.perfil.tipo
    except PerfilUsuario.DoesNotExist:
        tipo = 'vendedor'
    except (OperationalError, ProgrammingError):
        return Response({'detail': _DB_SCHEMA_HINT}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'tipo': tipo,
        },
    })
