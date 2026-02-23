from django.db import models
from django.conf import settings


class PerfilUsuario(models.Model):
    """Perfil que define el tipo de usuario: admin o vendedor."""
    TIPO_CHOICES = [
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
    ]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='vendedor')

    class Meta:
        verbose_name = 'Perfil de usuario'
        verbose_name_plural = 'Perfiles de usuario'

    def __str__(self):
        return f"{self.user.username} ({self.get_tipo_display()})"


class Categoria(models.Model):
    """Categoría para clasificar productos (ej. Alimentos, Limpieza, Electrónicos)."""
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """Producto del inventario."""
    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código SKU')
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos'
    )
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0, help_text='Alerta cuando el stock esté por debajo')
    unidad_medida = models.CharField(max_length=20, default='und')  # und, kg, L, etc.
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def bajo_stock(self):
        return self.stock_actual <= self.stock_minimo and self.stock_minimo > 0


class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
    ]
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='movimientos'
    )
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.PositiveIntegerField()
    motivo = models.CharField(max_length=200, blank=True)
    responsable = models.CharField(
        max_length=100,
        blank=True,
        help_text='Persona que registra el movimiento',
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.producto.nombre} x{self.cantidad}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.tipo == 'entrada':
            self.producto.stock_actual += self.cantidad
        else:
            self.producto.stock_actual -= self.cantidad
        self.producto.save(update_fields=['stock_actual', 'actualizado_en'])


class ReporteVenta(models.Model):
    """Reporte de ventas del día enviado por el vendedor, pendiente de aprobación del admin."""
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]
    fecha = models.DateField(help_text='Fecha del día reportado')
    vendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reportes_venta',
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    observaciones = models.CharField(max_length=500, blank=True)
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportes_aprobados',
    )
    aprobado_en = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Reporte de venta'
        verbose_name_plural = 'Reportes de venta'
        unique_together = [['fecha', 'vendedor']]

    def __str__(self):
        return f"Reporte {self.fecha} - {self.vendedor.username} ({self.get_estado_display()})"


class ReporteVentaLinea(models.Model):
    """Línea de un reporte: producto y cantidad vendida."""
    reporte = models.ForeignKey(
        ReporteVenta,
        on_delete=models.CASCADE,
        related_name='lineas',
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='lineas_reporte',
    )
    cantidad = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Línea de reporte'
        verbose_name_plural = 'Líneas de reporte'

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad}"
