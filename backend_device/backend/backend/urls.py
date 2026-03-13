from django.contrib import admin
from django.urls import path, include
from django.urls import re_path as url
from rest_framework.routers import SimpleRouter

from devices_management import views
from devices_management.consumers import ChatMessageConsumer


routes = SimpleRouter()

websocket_urlpatterns = [
    url(r'^ws/(?P<id_user>[^/]+)/$', ChatMessageConsumer.as_asgi()),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    url(r'^api/device/(?P<pk>[a-zA-Z0-9-]+)$', views.specific_device),
    url(r'^api/devicedata/(?P<id_device>[a-zA-Z0-9-]+)/(?P<year>[0-9]+)/(?P<month>[0-9]+)/(?P<day>[0-9]+)$', views.specific_device_data),
    url(r'^api/assignment/(?P<pk>[0-9]+)$', views.specific_assignment),
    url(r'^api/device/', views.manage_devices),
    url(r'^api/devicedata/', views.manage_device_data),
    url(r'^api/assignment/', views.manage_assignments),
    *routes.urls,
]
