
from django.contrib import admin
from django.urls import path
from django.urls import re_path as url
from rest_framework.routers import SimpleRouter

from users_management import views
from users_management.consumers import ChatMessageConsumer


routes = SimpleRouter()

websocket_urlpatterns = [
    url(r'^ws/(?P<id_user>[^/]+)/$', ChatMessageConsumer.as_asgi()),
]
