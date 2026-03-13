import os
import datetime
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users_management.models import User

user = User(id="00000000-0000-0000-0000-000000000000",
            username="admin",
            password="8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
            role="admin",
            updated=datetime.datetime.now(),
            created=datetime.datetime.now())
# user.set_password("admin")
print(user.password)

try:
    user.save()
except Exception as ex:
    print(ex)
