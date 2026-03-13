import uuid

from django.db import models
from users_management.models import User

class Device(models.Model):
    id = models.UUIDField(primary_key=True, unique=True, default=uuid.uuid4)
    description = models.TextField()
    address = models.TextField()
    maxhec = models.FloatField()

    def _str_(self):
        return f"{self.id}[{self.address}]"


class DeviceData(models.Model):
    timestamp = models.DateTimeField()
    id_device = models.ForeignKey(Device, on_delete=models.CASCADE)
    energy_consumption = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['timestamp', 'id_device'], name='unique_semd_timestamp_combination'
            )
        ]

    def _str_(self):
        return f"{self.id_device} = {self.energy_consumption} [{self.timestamp}]"


class Assignment(models.Model):
    id_user = models.ForeignKey(User, on_delete=models.CASCADE)
    id_device = models.ForeignKey(Device, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['id_user', 'id_device'], name='unique_user_device_combination'
            )
        ]

    def _str_(self):
        return f"{self.id_user}:{self.id_device}"
