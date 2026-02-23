from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Categoria, Producto, MovimientoInventario, ReporteVenta, ReporteVentaLinea, PerfilUsuario

User = get_user_model()


class CategoriaSerializer(serializers.ModelSerializer):
    productos_count = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'productos_count']

    def get_productos_count(self, obj):
        return obj.productos.count()


class ProductoListSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    bajo_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'categoria', 'categoria_nombre',
            'precio_venta', 'stock_actual', 'stock_minimo', 'unidad_medida',
            'imagen', 'activo', 'bajo_stock', 'creado_en',
        ]


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'categoria', 'precio_venta',
            'stock_actual', 'stock_minimo', 'unidad_medida', 'imagen', 'activo',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['creado_en', 'actualizado_en']


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_codigo',
            'tipo', 'cantidad', 'motivo', 'responsable', 'fecha',
        ]
        read_only_fields = ['fecha']


class MovimientoInventarioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = ['id', 'producto', 'tipo', 'cantidad', 'motivo', 'responsable', 'fecha']
        read_only_fields = ['fecha']


# --- Reportes de venta ---

class ReporteVentaLineaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)

    class Meta:
        model = ReporteVentaLinea
        fields = ['id', 'producto', 'producto_codigo', 'producto_nombre', 'cantidad']


class ReporteVentaLineaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteVentaLinea
        fields = ['producto', 'cantidad']


class ReporteVentaSerializer(serializers.ModelSerializer):
    lineas = ReporteVentaLineaSerializer(many=True, read_only=True)
    vendedor_username = serializers.CharField(source='vendedor.username', read_only=True)

    class Meta:
        model = ReporteVenta
        fields = [
            'id', 'fecha', 'vendedor', 'vendedor_username', 'estado', 'observaciones',
            'aprobado_por', 'aprobado_en', 'creado_en', 'lineas',
        ]
        read_only_fields = ['vendedor', 'estado', 'aprobado_por', 'aprobado_en', 'creado_en']


class ReporteVentaCreateSerializer(serializers.ModelSerializer):
    lineas = ReporteVentaLineaCreateSerializer(many=True)

    class Meta:
        model = ReporteVenta
        fields = ['fecha', 'lineas']

    def create(self, validated_data):
        lineas_data = validated_data.pop('lineas')
        request = self.context.get('request')
        reporte = ReporteVenta.objects.create(
            vendedor=request.user,
            fecha=validated_data['fecha'],
        )
        for item in lineas_data:
            ReporteVentaLinea.objects.create(reporte=reporte, **item)
        return reporte


# --- Vendedores (solo admin puede listar y crear) ---

class VendedorSerializer(serializers.ModelSerializer):
    """Solo lectura: datos del vendedor para listar."""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'date_joined']


class VendedorCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email') or '',
            password=password,
            first_name=validated_data.get('first_name') or '',
            last_name=validated_data.get('last_name') or '',
        )
        PerfilUsuario.objects.get_or_create(user=user, defaults={'tipo': 'vendedor'})
        return user


class VendedorUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and password.strip():
            instance.set_password(password)
        instance.save()
        return instance
