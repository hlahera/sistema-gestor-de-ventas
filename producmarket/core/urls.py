"""
URL configuration for core project.
"""
import os

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('inventario.urls')),
]

# Archivos subidos (imágenes de productos)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif os.environ.get('SERVE_MEDIA', 'true').lower() in ('true', '1', 'yes'):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
