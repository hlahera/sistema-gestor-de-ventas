# Migración de datos: categorías de ejemplo para clasificar productos

from django.db import migrations


def crear_categorias_iniciales(apps, schema_editor):
    Categoria = apps.get_model('inventario', 'Categoria')
    categorias = [
        ('Alimentos', 'Productos alimenticios, bebidas, abarrotes'),
        ('Limpieza', 'Productos de limpieza e higiene'),
        ('Electrónicos', 'Dispositivos y accesorios electrónicos'),
    ]
    for nombre, descripcion in categorias:
        Categoria.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion})


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0003_add_producto_descripcion_imagen'),
    ]

    operations = [
        migrations.RunPython(crear_categorias_iniciales, noop),
    ]
