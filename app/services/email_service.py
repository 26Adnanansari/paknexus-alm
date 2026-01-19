import aiosmtplib
from email.message import EmailMessage
from app.core.config import settings
from app.services.email_templates import password_recovery_otp_email
import logging

logger = logging.getLogger(__name__)

async def send_email(email_to: str, subject: str, html_content: str):
    message = EmailMessage()
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    message["Subject"] = subject
    message.set_content("Please view the HTML version of this email.")
    message.add_alternative(html_content, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_PORT == 465,
            start_tls=settings.SMTP_PORT == 587,
        )
        logger.info(f"Email sent to {email_to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {str(e)}")
        return False

async def send_password_recovery_otp(email_to: str, user_name: str, otp: str):
    email_data = password_recovery_otp_email(user_name=user_name, otp=otp)
    return await send_email(
        email_to=email_to,
        subject=email_data["subject"],
        html_content=email_data["html"]
    )
