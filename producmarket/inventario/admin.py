from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Categoria, Producto, MovimientoInventario, PerfilUsuario, ReporteVenta, ReporteVentaLinea


class PerfilUsuarioInline(admin.StackedInline):
    model = PerfilUsuario
    can_delete = False
    verbose_name = 'Perfil'
    verbose_name_plural = 'Tipo de usuario'
    fk_name = 'user'


class UserAdminConPerfil(BaseUserAdmin):
    inlines = (PerfilUsuarioInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_tipo')

    def get_tipo(self, obj):
        try:
            return obj.perfil.get_tipo_display()
        except PerfilUsuario.DoesNotExist:
            return '-'
    get_tipo.short_description = 'Tipo'


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ['user', 'tipo']
    list_filter = ['tipo']
    search_fields = ['user__username', 'user__email']
    raw_id_fields = ['user']


admin.site.unregister(User)
admin.site.register(User, UserAdminConPerfil)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'stock_actual', 'stock_minimo', 'precio_venta', 'activo']
    list_filter = ['categoria', 'activo']
    search_fields = ['codigo', 'nombre', 'descripcion']


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ['producto', 'tipo', 'cantidad', 'responsable', 'motivo', 'fecha']
    list_filter = ['tipo', 'fecha']


class ReporteVentaLineaInline(admin.TabularInline):
    model = ReporteVentaLinea
    extra = 0


@admin.register(ReporteVenta)
class ReporteVentaAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'vendedor', 'estado', 'aprobado_por', 'creado_en']
    list_filter = ['estado', 'fecha']
    inlines = [ReporteVentaLineaInline]
