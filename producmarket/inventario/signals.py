from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import PerfilUsuario


@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    """Crea automáticamente un perfil cuando se crea un usuario."""
    if created and not hasattr(instance, 'perfil'):
        PerfilUsuario.objects.get_or_create(
            user=instance,
            defaults={'tipo': 'vendedor' if not instance.is_superuser else 'admin'}
        )
