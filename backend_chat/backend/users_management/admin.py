from django.contrib.auth.backends import BaseBackend

from .models import User


class AdminBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        try:
            user = User.objects.get(username=username, password=password)
            return user
        except Exception as e:
            print(e)
        return None

    def get_user(self, username):
        try:
            return User.objects.get(username=username)
        except Exception as e:
            print(e)
        return None
