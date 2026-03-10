import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.voice_session import VoiceSession
from app.models.voice_message import VoiceMessage
from app.models.session import ChatSession
from app.models.message import Message

print(f"ChatSession table: {ChatSession.__tablename__}")
print(f"Message table: {Message.__tablename__}")
print(f"VoiceSession table: {VoiceSession.__tablename__}")
print(f"VoiceMessage table: {VoiceMessage.__tablename__}")

if VoiceSession.__tablename__ != ChatSession.__tablename__:
    print("✅ SUCCESS: Voice sessions have a separate table.")
else:
    print("❌ FAILURE: Voice sessions are using the same table.")

if VoiceMessage.__tablename__ != Message.__tablename__:
    print("✅ SUCCESS: Voice messages have a separate table.")
else:
    print("❌ FAILURE: Voice messages are using the same table.")
