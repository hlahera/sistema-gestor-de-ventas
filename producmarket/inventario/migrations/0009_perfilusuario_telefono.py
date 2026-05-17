# Generated manually for PerfilUsuario.telefono

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0008_movimientoinventario_creado_por'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfilusuario',
            name='telefono',
            field=models.CharField(blank=True, default='', max_length=32, verbose_name='teléfono'),
        ),
    ]
