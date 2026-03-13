"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/howto/deployment/asgi/
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter

from django.core.asgi import get_asgi_application
from .urls import websocket_urlpatterns
from time import sleep

asgi_application = get_asgi_application()

application = ProtocolTypeRouter({
    'websocket':
        URLRouter(
            websocket_urlpatterns
        ),
    "http": asgi_application,
})
print(application.application_mapping)

while True:
    sleep(1)