import os
import json
import smtplib
import threading
import redis
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

redis_client = redis.StrictRedis(host='localhost', port=6379)

SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

RESERVATION_QUEUE = os.getenv('RESERVATION_QUEUE')
PAYMENT_QUEUE = os.getenv('PAYMENT_QUEUE')
ORDER_QUEUE = os.getenv('ORDER_QUEUE')

ADMIN_EMAIL = "grublane@yahoo.com"  # Admin email address for notifications
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')

# Update the template map for orders, payments, and reservations
QUEUE_TEMPLATE_MAP = {
    RESERVATION_QUEUE: 'reservation_template.html',
    PAYMENT_QUEUE: 'payment_template.html',
    ORDER_QUEUE: 'order_template.html'
}

ADMIN_TEMPLATE_MAP = {
    RESERVATION_QUEUE: 'admin_reservation_template.html',
    PAYMENT_QUEUE: 'admin_payment_template.html',
    ORDER_QUEUE: 'admin_order_template.html'
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def load_template(template_name):
    template_path = os.path.join(TEMPLATE_DIR, template_name)
    try:
        with open(template_path, 'r', encoding='utf-8') as template_file:
            return template_file.read()
    except FileNotFoundError:
        logging.error(f"Template {template_name} not found in {TEMPLATE_DIR}")
        return None


def render_template(template, context):
    for key, value in context.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


def send_email(recipient_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logging.info(f"Email sent to {recipient_email}")

    except Exception as e:
        logging.error(f"Failed to send email to {recipient_email}: {e}")


def notify_admin(action_type, context, queue_name):
    # Select the correct template for the admin notification based on the queue
    admin_template = ADMIN_TEMPLATE_MAP.get(queue_name)
    if not admin_template:
        logging.error(f"No admin template mapped for queue: {queue_name}")
        return

    subject = f"New {action_type.capitalize()} Notification"
    body = render_template(load_template(admin_template), context)
    send_email(ADMIN_EMAIL, subject, body)


def email_worker(queue_name):
    logging.info(f"Listening for messages on {queue_name}...")
    template_name = QUEUE_TEMPLATE_MAP.get(queue_name)
    if not template_name:
        logging.error(f"No template mapped for queue: {queue_name}")
        return

    template = load_template(template_name)
    if not template:
        return

    while True:
        task = redis_client.blpop(queue_name)
        if task:
            _, task_data = task
            task_data = json.loads(task_data)
            print(task_data)

            # Unified context for reservations, payments, and orders
            context = {
                'recipient_name': task_data.get('name'),
                'recipient_address': task_data.get('address'),
                'recipient_phonenumber': task_data.get('phone_number'),
                'email': task_data.get('email'),  # Common field for all
                'amount_paid': task_data.get('amount_paid', 'N/A'),  # For payments and orders
                'order_number': task_data.get('order_number', 'N/A'),  # For orders
                'order_date': task_data.get('date', 'N/A'),  # For orders and reservations
                'paystack_reference': task_data.get('paystack_reference', 'N/A'),  # For payments and orders
                'order_items': task_data.get('order_details', []),  # For orders
                'guest_count': task_data.get('guest_count', 'N/A'),  # For reservations
                'reservation_date': task_data.get('date_time', '').split()[0] if queue_name == RESERVATION_QUEUE else 'N/A',
                'reservation_time': task_data.get('date_time', '').split()[1] if queue_name == RESERVATION_QUEUE else 'N/A'
            }

            # Subject based on the queue name
            if queue_name == ORDER_QUEUE:
                subject = "Order Confirmation"
            elif queue_name == PAYMENT_QUEUE:
                subject = "Payment Confirmation"
            else:  # RESERVATION_QUEUE
                subject = "Reservation Confirmation"

            recipient_email = task_data.get('email')  # Use the same email field for all

            body = render_template(template, context)

            # Send email to user
            send_email(recipient_email, subject, body)

            # Notify admin after sending the email
            notify_admin(queue_name.capitalize(), context, queue_name)


def start_workers():
    queues = [RESERVATION_QUEUE, PAYMENT_QUEUE, ORDER_QUEUE]  
    for queue_name in queues:
        worker_thread = threading.Thread(target=email_worker, args=(queue_name,))
        worker_thread.daemon = True
        worker_thread.start()


if __name__ == "__main__":
    start_workers()
    try:
        while True:
            pass
    except KeyboardInterrupt:
        logging.info("Shutting down workers.")
