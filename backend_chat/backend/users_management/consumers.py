import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer

from users_management.models import User


class ChatMessageConsumer(WebsocketConsumer):
    def connect(self):
        self.id_user = self.scope['url_route']['kwargs']['id_user']
        print("WSConnected:", self.id_user, flush=True)
        user = User.objects.get(id=self.id_user)
        if user:
            if user.role == "admin":
                self.group_name = "chat_admin"
                self.is_admin = True
            else:
                self.group_name = f"chat_{self.id_user}"
                self.is_admin = False
            # Join room group
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )
            self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

    def receive(self, text_data=None, bytes_data=None):
        # Receive message from WebSocket
        data = json.loads(text_data)
        if "text" in data:
            if data["text"]["to"] == "admin":
                if self.is_admin is False:
                    async_to_sync(get_channel_layer().group_send)("chat_admin", data)
            else:
                async_to_sync(get_channel_layer().group_send)(f"chat_{data['text']['to']}", data)

    def chat_message(self, event):
        # Receive message from room group
        text = event['text']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'text': text,
        }))
