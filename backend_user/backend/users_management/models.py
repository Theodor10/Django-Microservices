import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):

    def create_user(self, username, password, **kwargs):
        if password is None or username is None:
            raise TypeError('Invalid credentials.')

        user = self.model(username=username, password=password, role="user")
        user.save(using=self._db)

        return user

    def create_superuser(self, username, password):
        if password is None or username is None:
            raise TypeError('Invalid credentials.')

        user = self.model(username=username, password=password, role="admin")
        user.is_superuser = True
        user.save(using=self._db)

        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(db_index=True, primary_key=True, unique=True, default=uuid.uuid4)
    role = models.TextField(choices=[("admin", "admin"), ("user", "user")], default="user")
    username = models.TextField(max_length=100, unique=True, null=False)
    password = models.TextField(max_length=100, default="", null=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created = models.DateTimeField()
    updated = models.DateTimeField()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['']

    objects = UserManager()

    def __str__(self):
        return f"{self.username}"

