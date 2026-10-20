import smtplib
from email.message import EmailMessage


class CommunicationController:
    """
    Handles sending messages (email / notifications).
    """

    def send_email(self, sender, password, receiver, subject, body):
        try:
            msg = EmailMessage()
            msg["From"] = sender
            msg["To"] = receiver
            msg["Subject"] = subject
            msg.set_content(body)

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                smtp.login(sender, password)
                smtp.send_message(msg)

            return {"status": "success", "message": "Email sent"}

        except Exception as e:
            return {"status": "error", "message": str(e)}
