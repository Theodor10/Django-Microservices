from rest_framework import serializers

from .models import Device, DeviceData, Assignment


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ('id', 'description', 'address', "maxhec")


class DeviceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceData
        fields = ('timestamp', 'id_device', 'energy_consumption')


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ('id', 'id_user', 'id_device')
