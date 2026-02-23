# Agregar responsable a movimientos de inventario

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0004_categorias_iniciales'),
    ]

    operations = [
        migrations.AddField(
            model_name='movimientoinventario',
            name='responsable',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Persona que registra el movimiento',
                max_length=100,
            ),
        ),
    ]
