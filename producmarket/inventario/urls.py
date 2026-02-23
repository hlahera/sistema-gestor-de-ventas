from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProductoViewSet, MovimientoInventarioViewSet, ReporteVentaViewSet, VendedorViewSet
from . import auth_views

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')
router.register(r'reportes', ReporteVentaViewSet, basename='reporte')
router.register(r'vendedores', VendedorViewSet, basename='vendedor')

urlpatterns = [
    path('auth/login/', auth_views.login),
    path('auth/me/', auth_views.me),
    path('', include(router.urls)),
]
