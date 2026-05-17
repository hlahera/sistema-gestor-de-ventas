# Quitar límite de un reporte por (fecha, vendedor): varios reportes permitidos.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0009_perfilusuario_telefono'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='reporteventa',
            unique_together=set(),
        ),
    ]
