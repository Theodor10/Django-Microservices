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
from devices_management.consumers import create_rabbitmq_connection

from time import sleep

sleep(15)

asgi_application = get_asgi_application()

create_rabbitmq_connection()

application = ProtocolTypeRouter({
    'websocket':
        URLRouter(
            websocket_urlpatterns
        ),
    "http": asgi_application,
})
print(application.application_mapping)