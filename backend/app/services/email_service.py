import logging
import os

logger = logging.getLogger(__name__)

# Ensure logs directory exists
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

EMAIL_PREVIEW_FILE = os.path.join(LOG_DIR, "email_previews.txt")

async def send_password_reset_email(email: str, token: str):
    """
    Simulates sending an email by logging it to the console and a preview file.
    In a real app, this would use SMTP or an API (SendGrid, Mailgun, etc.)
    """
    reset_link = f"http://localhost:5173/auth/reset-password?token={token}"
    
    subject = "Campus AI - Password Reset Request"
    body = f"""
    Hello,

    We received a request to reset your password for Campus AI OS.
    Click the link below to set a new password:

    {reset_link}

    This link will expire in 60 minutes.
    If you did not request this, please ignore this email.

    Regards,
    Campus AI Team
    """

    # Log to console
    logger.info("--------- OUTGOING EMAIL (MOCK) ---------")
    logger.info(f"TO: {email}")
    logger.info(f"SUBJECT: {subject}")
    logger.info(f"LINK: {reset_link}")
    logger.info("-----------------------------------------")

    # Append to preview file
    with open(EMAIL_PREVIEW_FILE, "a") as f:
        f.write("="*50 + "\n")
        f.write(f"TO: {email}\n")
        f.write(f"SUBJECT: {subject}\n")
        f.write(f"BODY:\n{body}\n")
        f.write("="*50 + "\n\n")

    return True
