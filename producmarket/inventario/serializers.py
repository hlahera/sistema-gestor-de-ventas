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
        extra_kwargs = {
            # Mensaje de unicidad en español (validate_codigo sustituye al UniqueValidator por defecto)
            'codigo': {'validators': []},
        }

    def validate_codigo(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('El código SKU es obligatorio.')
        qs = Producto.objects.filter(codigo=value)
        if getattr(self, 'instance', None) and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'Ya existe un producto con este Código SKU. Indica otro código único.'
            )
        return value


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    precio_venta = serializers.DecimalField(
        source='producto.precio_venta',
        max_digits=12,
        decimal_places=2,
        read_only=True,
        coerce_to_string=True,
    )
    creado_por = serializers.IntegerField(source='creado_por_id', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_codigo', 'precio_venta',
            'tipo', 'cantidad', 'motivo', 'responsable', 'creado_por', 'fecha',
        ]
        read_only_fields = ['fecha']


class MovimientoInventarioCreateSerializer(serializers.ModelSerializer):
    def validate_cantidad(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError('La cantidad debe ser al menos 1.')
        return value

    def validate(self, attrs):
        producto = attrs.get('producto')
        tipo = attrs.get('tipo')
        cantidad = attrs.get('cantidad') or 0

        if tipo == 'salida' and producto and cantidad:
            if producto.stock_actual < cantidad:
                raise serializers.ValidationError({
                    'cantidad': f'Stock insuficiente. Disponible: {producto.stock_actual}.'
                })
        return attrs

    class Meta:
        model = MovimientoInventario
        fields = ['id', 'producto', 'tipo', 'cantidad', 'motivo', 'responsable', 'fecha']
        read_only_fields = ['fecha']


# --- Reportes de venta ---

class ReporteVentaLineaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    precio_venta = serializers.DecimalField(
        source='producto.precio_venta',
        max_digits=12,
        decimal_places=2,
        read_only=True,
        coerce_to_string=True,
    )

    class Meta:
        model = ReporteVentaLinea
        fields = [
            'id', 'producto', 'producto_codigo', 'producto_nombre', 'cantidad', 'precio_venta',
        ]


class ReporteVentaLineaCreateSerializer(serializers.ModelSerializer):
    def validate_cantidad(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError('La cantidad debe ser al menos 1.')
        return value

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
        read_only_fields = ['fecha', 'vendedor', 'estado', 'aprobado_por', 'aprobado_en', 'creado_en']


class ReporteVentaCreateSerializer(serializers.ModelSerializer):
    lineas = ReporteVentaLineaCreateSerializer(many=True)

    class Meta:
        model = ReporteVenta
        fields = ['fecha', 'lineas']

    def validate_fecha(self, value):
        from django.utils import timezone
        if value > timezone.localdate():
            raise serializers.ValidationError('La fecha del reporte no puede ser futura.')
        return value

    def validate_lineas(self, value):
        if not value:
            raise serializers.ValidationError('Debe incluir al menos una línea de producto.')
        producto_ids = [item['producto'].id for item in value]
        if len(producto_ids) != len(set(producto_ids)):
            raise serializers.ValidationError('No repitas el mismo producto en el reporte.')
        return value

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
    telefono = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'telefono', 'is_active', 'date_joined']

    def get_telefono(self, obj):
        perfil = getattr(obj, 'perfil', None)
        return (perfil.telefono if perfil else '') or ''


class VendedorCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    telefono = serializers.CharField(required=False, allow_blank=True, max_length=32)

    def create(self, validated_data):
        password = validated_data.pop('password')
        telefono = validated_data.pop('telefono', '') or ''
        user = User.objects.create_user(
            username=validated_data['username'],
            email='',
            password=password,
            first_name=validated_data.get('first_name') or '',
            last_name=validated_data.get('last_name') or '',
        )
        perfil, _ = PerfilUsuario.objects.get_or_create(user=user, defaults={'tipo': 'vendedor'})
        if telefono:
            perfil.telefono = telefono.strip()
            perfil.save(update_fields=['telefono'])
        return user


class VendedorUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    telefono = serializers.CharField(required=False, allow_blank=True, max_length=32)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        telefono = validated_data.pop('telefono', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and password.strip():
            instance.set_password(password)
        instance.save()
        if telefono is not None:
            perfil, _ = PerfilUsuario.objects.get_or_create(user=instance, defaults={'tipo': 'vendedor'})
            perfil.telefono = (telefono or '').strip()
            perfil.save(update_fields=['telefono'])
        return instance
