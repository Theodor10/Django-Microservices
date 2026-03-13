import json
import datetime
import threading
import pika
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.generic.websocket import WebsocketConsumer

from .models import Device, DeviceData, Assignment

#sends data to the client through websocket if the energy is above a threshold
def validate_energy(id_device, energy):
    device = Device.objects.filter(id=id_device)[0]
    if device.maxhec > energy:
        return

    id_user = Assignment.objects.filter(id_device=id_device).values('id_user')
    if not id_user or len(id_user) == 0:
        return
    id_user = id_user[0]["id_user"]

    channel = get_channel_layer()
    message = f"Device {id_device} has higher energy consumption at {energy}."

    async_to_sync(channel.group_send)(
        'chat_%s' % id_user,
        {
            'type': 'chat_message',
            'message': message,
        }
    )
    print(message, flush=True)

#creates the rabbitmq connection
def create_rabbitmq_connection():
    def main_connection_thread():
        with pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq')) as connection:
            channel = connection.channel()
            channel.queue_declare(queue='sd')

            def callback(ch, method, properties, body):
                data = json.loads(body.decode())
                id_device = data["device_id"]

                device_datas = DeviceData.objects.filter(id_device=id_device).order_by('-timestamp')
                if device_datas and len(device_datas) > 0:
                    device_data = device_datas[0]
                    if data["timestamp"] - datetime.datetime.timestamp(device_data.timestamp) < 40:  # 60 * 60:
                        device_data.energy_consumption += float(data["measurement_value"])
                        device_data.save()
                        validate_energy(id_device, device_data.energy_consumption)
                        return

                device = Device.objects.filter(id=id_device)
                if len(device) <= 0:
                    return

                device_data = DeviceData(
                    id_device=device[0],
                    timestamp=datetime.datetime.fromtimestamp(data["timestamp"]),
                    energy_consumption=float(data["measurement_value"])
                )
                device_data.save()
                validate_energy(id_device, device_data.energy_consumption)

            channel.basic_consume(queue='sd', on_message_callback=callback, auto_ack=True)
            channel.start_consuming()

    threading.Thread(target=main_connection_thread, daemon=True).start()


class ChatMessageConsumer(WebsocketConsumer):
    def connect(self):

        self.id_user = self.scope['url_route']['kwargs']['id_user']
        print("WSConnected:", self.id_user)
        self.id_user_group_name = 'chat_%s' % self.id_user
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.id_user_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.id_user_group_name,
            self.channel_name
        )

    def receive(self, text_data=None, bytes_data=None):
        # Receive message from WebSocket
        text_data_json = json.loads(text_data)
        text = text_data_json['text']
        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.id_user_group_name,
            {
                'type': 'chat_message',
                'message': text,
            }
        )

    def chat_message(self, event):
        # Receive message from room group
        text = event['message']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'text': text,
        }))