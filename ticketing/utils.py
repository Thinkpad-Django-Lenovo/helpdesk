from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_ws_notification(user_id, event_type, data):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "notify",
            "content": {
                "type": event_type,
                "data": data
            }
        }
    )