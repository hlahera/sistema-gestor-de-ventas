from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
from django.db.models import Sum, F, Q, DecimalField, ExpressionWrapper
from django.db.models.functions import ExtractYear, ExtractMonth
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Categoria, Producto, MovimientoInventario, ReporteVenta, ReporteVentaLinea
from .serializers import (
    CategoriaSerializer,
    ProductoListSerializer,
    ProductoSerializer,
    MovimientoInventarioSerializer,
    MovimientoInventarioCreateSerializer,
    ReporteVentaSerializer,
    ReporteVentaCreateSerializer,
    VendedorSerializer,
    VendedorCreateSerializer,
    VendedorUpdateSerializer,
)

User = get_user_model()


def _es_admin(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    try:
        return user.perfil.tipo == 'admin'
    except Exception:
        return False


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related('categoria')
    filter_backends = [SearchFilter]
    search_fields = ['codigo', 'nombre', 'categoria__nombre']

    def get_queryset(self):
        qs = Producto.objects.select_related('categoria')
        categoria = self.request.query_params.get('categoria')
        if categoria:
            try:
                qs = qs.filter(categoria_id=int(categoria))
            except (ValueError, TypeError):
                pass
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductoListSerializer
        return ProductoSerializer

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Resumen para el dashboard: totales y productos bajo stock."""
        total_productos = Producto.objects.filter(activo=True).count()
        bajo_stock = Producto.objects.filter(
            activo=True,
            stock_minimo__gt=0,
        ).extra(where=['stock_actual <= stock_minimo']).count()
        valor_inventario = Producto.objects.filter(activo=True).aggregate(
            total=Sum(F('stock_actual') * F('precio_venta'))
        )['total'] or 0
        ultimos_movimientos = MovimientoInventario.objects.select_related('producto')[:10]
        serializer_mov = MovimientoInventarioSerializer(ultimos_movimientos, many=True)
        return Response({
            'total_productos': total_productos,
            'productos_bajo_stock': bajo_stock,
            'valor_inventario': float(valor_inventario),
            'ultimos_movimientos': serializer_mov.data,
        })

    @action(detail=False, methods=['get'])
    def top_ventas(self, request):
        """Los 10 productos más vendidos (por cantidad total de salidas). Solo para admin."""
        top = (
            Producto.objects.filter(activo=True)
            .annotate(
                total_vendido=Sum('movimientos__cantidad', filter=Q(movimientos__tipo='salida'))
            )
            .filter(total_vendido__gt=0)
            .order_by('-total_vendido')[:10]
            .values('id', 'codigo', 'nombre', 'precio_venta', 'total_vendido')
        )
        return Response(list(top))

    @action(detail=False, methods=['get'])
    def ventas_por_mes(self, request):
        """Importe de ventas por mes (solo movimientos tipo salida). Solo admin. Últimos 12 meses."""
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede ver esta información.'}, status=status.HTTP_403_FORBIDDEN)
        qs = (
            MovimientoInventario.objects.filter(tipo='salida')
            .annotate(
                year=ExtractYear('fecha'),
                month=ExtractMonth('fecha'),
            )
            .values('year', 'month')
            .annotate(
                importe=Sum(
                    ExpressionWrapper(
                        F('cantidad') * F('producto__precio_venta'),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                )
            )
            .order_by('-year', '-month')[:12]
        )
        meses_nombre = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        result = [
            {
                'anio': r['year'],
                'mes': r['month'],
                'mes_label': f"{meses_nombre[r['month']]} {r['year']}",
                'importe': float(r['importe'] or 0),
            }
            for r in qs
        ]
        return Response(result)


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.select_related('producto').order_by('-fecha')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return MovimientoInventarioCreateSerializer
        return MovimientoInventarioSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data
        responsable = (data.get('responsable') or '').strip()
        if not responsable and self.request.user.is_authenticated:
            responsable = self.request.user.get_full_name().strip() or self.request.user.username
        serializer.save(responsable=responsable or data.get('responsable', ''))


class ReporteVentaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ReporteVenta.objects.select_related('vendedor').prefetch_related('lineas__producto')
        if _es_admin(self.request.user):
            estado = self.request.query_params.get('estado')
            if estado:
                qs = qs.filter(estado=estado)
            return qs.order_by('-creado_en')
        return qs.filter(vendedor=self.request.user).order_by('-creado_en')

    def get_serializer_class(self):
        if self.action == 'create':
            return ReporteVentaCreateSerializer
        return ReporteVentaSerializer

    def create(self, request, *args, **kwargs):
        if _es_admin(request.user):
            return Response(
                {'detail': 'Solo los vendedores pueden crear reportes.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {'detail': 'Ya tienes un reporte para esta fecha. Solo se permite uno por día.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if not _es_admin(request.user) and obj.vendedor_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede aprobar.'}, status=status.HTTP_403_FORBIDDEN)
        reporte = self.get_object()
        if reporte.estado != 'pendiente':
            return Response({'detail': 'Solo se pueden aprobar reportes pendientes.'}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        vendedor_nombre = reporte.vendedor.get_full_name() or reporte.vendedor.username
        for linea in reporte.lineas.select_related('producto').all():
            MovimientoInventario.objects.create(
                producto=linea.producto,
                tipo='salida',
                cantidad=linea.cantidad,
                motivo=f'Reporte ventas {reporte.fecha} aprobado',
                responsable=vendedor_nombre,
            )
        reporte.estado = 'aprobado'
        reporte.aprobado_por = request.user
        reporte.aprobado_en = now
        reporte.save(update_fields=['estado', 'aprobado_por', 'aprobado_en'])
        return Response(ReporteVentaSerializer(reporte).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede rechazar.'}, status=status.HTTP_403_FORBIDDEN)
        reporte = self.get_object()
        if reporte.estado != 'pendiente':
            return Response({'detail': 'Solo se pueden rechazar reportes pendientes.'}, status=status.HTTP_400_BAD_REQUEST)
        observaciones = request.data.get('observaciones', '')[:500]
        reporte.estado = 'rechazado'
        reporte.observaciones = observaciones
        reporte.aprobado_por = request.user
        reporte.aprobado_en = timezone.now()
        reporte.save(update_fields=['estado', 'observaciones', 'aprobado_por', 'aprobado_en'])
        return Response(ReporteVentaSerializer(reporte).data)


class VendedorViewSet(viewsets.ModelViewSet):
    """Solo admin: listar, crear, modificar y eliminar vendedores."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not _es_admin(self.request.user):
            return User.objects.none()
        # Solo vendedores activos (los "eliminados" se desactivan pero se conservan reportes/ventas)
        return User.objects.filter(perfil__tipo='vendedor', is_active=True).order_by('username')

    def get_serializer_class(self):
        if self.action == 'create':
            return VendedorCreateSerializer
        if self.action in ('update', 'partial_update'):
            return VendedorUpdateSerializer
        return VendedorSerializer

    def list(self, request, *args, **kwargs):
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede ver la lista de vendedores.'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not _es_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede crear vendedores.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
            return Response(VendedorSerializer(user).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {'detail': 'Ya existe un usuario con ese nombre.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede modificar vendedores.'}, status=status.HTTP_403_FORBIDDEN)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VendedorSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        if not _es_admin(request.user):
            return Response({'detail': 'Solo el administrador puede eliminar vendedores.'}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        # No borrar el usuario: desactivar para conservar reportes y ventas asociados
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
