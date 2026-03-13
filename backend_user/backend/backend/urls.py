
from django.contrib import admin
from django.urls import path
from django.urls import re_path as url
from rest_framework.routers import SimpleRouter

from users_management import views
from users_management.consumers import ChatMessageConsumer


routes = SimpleRouter()

routes.register(r'auth/login', views.LoginViewSet, basename='auth-login')
routes.register(r'auth/refresh', views.RefreshViewSet, basename='auth-refresh')

websocket_urlpatterns = [
    url(r'^ws/(?P<id_user>[^/]+)/$', ChatMessageConsumer.as_asgi()),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    url(r'^api/user/(?P<pk>[a-zA-Z0-9-]+)$', views.specific_user),
    url(r'^api/user/', views.manage_users),
    *routes.urls,
]
