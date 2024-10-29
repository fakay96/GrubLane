import os
import json
import smtplib
import threading
import redis
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Set up Redis client
redis_client = redis.StrictRedis(host='localhost', port=6379)

# SMTP email server configuration
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

# Redis queue names for reservations, payments, and orders
RESERVATION_QUEUE = os.getenv('RESERVATION_QUEUE')
PAYMENT_QUEUE = os.getenv('PAYMENT_QUEUE')
ORDER_QUEUE = os.getenv('ORDER_QUEUE')

# Admin email for notifications
ADMIN_EMAIL = "grublane@yahoo.com"

# Directory for email templates
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')

# Template map for different types of emails
QUEUE_TEMPLATE_MAP = {
    RESERVATION_QUEUE: 'reservation_template.html',
    PAYMENT_QUEUE: 'payment_template.html',
    ORDER_QUEUE: 'order_template.html'
}

# Admin template map
ADMIN_TEMPLATE_MAP = {
    RESERVATION_QUEUE: 'admin_reservation_template.html',
    PAYMENT_QUEUE: 'admin_payment_template.html',
    ORDER_QUEUE: 'admin_order_template.html'
}

# Logging configuration
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
    admin_template = ADMIN_TEMPLATE_MAP.get(queue_name)
    if not admin_template:
        logging.error(f"No admin template mapped for queue: {queue_name}")
        return

    subject = f"New {action_type.capitalize()} Notification"
    body = render_template(load_template(admin_template), context)
    send_email(ADMIN_EMAIL, subject, body)

def format_datetime(datetime_str):
    try:
        parsed_date = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        return parsed_date.strftime('%Y-%m-%d %H:%M')
    except (ValueError, TypeError):
        return 'N/A'

def store_incomplete_data(reference, data, queue_type):
    redis_client.hset(f"transaction:{reference}", queue_type, json.dumps(data))
    redis_client.expire(f"transaction:{reference}", 3600)

def fetch_and_merge_data(reference):
    order_data = redis_client.hget(f"transaction:{reference}", "order")
    payment_data = redis_client.hget(f"transaction:{reference}", "payment")
    
    if order_data and payment_data:
        order_data = json.loads(order_data)
        payment_data = json.loads(payment_data)

        order_date = format_datetime(order_data.get('date', 'N/A'))
        payment_date = format_datetime(payment_data.get('payment_date', 'N/A'))

        merged_data = {
            'recipient_name': order_data.get('name', payment_data.get('name')),
            'recipient_address': order_data.get('address', payment_data.get('address')),
            'recipient_phonenumber': order_data.get('phone_number', payment_data.get('phone_number')),
            'email': order_data.get('email', payment_data.get('email')),
            'order_number': order_data.get('order_number'),
            'amount_paid': payment_data.get('amount'),
            'paystack_reference': order_data.get('paystack_reference'),
            'order_items': json.loads(order_data.get('order_details', '{"items": []}')).get('items', []),
            'payment_method': payment_data.get('payment_method'),
            'payment_status': payment_data.get('status'),
            'payment_date': payment_date,
            'order_date': order_date
        }

        redis_client.delete(f"transaction:{reference}")
        return merged_data
    
    return None

def email_worker(queue_name):
    logging.info(f"Listening for messages on {queue_name}...")

    template_name = QUEUE_TEMPLATE_MAP.get(queue_name)
    if not template_name:
        logging.error(f"No template mapped for queue: {queue_name}")
        return
    
    while True:
        task = redis_client.blpop(queue_name)
        if task:
            _, task_data = task
            task_data = json.loads(task_data)
            paystack_reference = task_data.get('paystack_reference') or task_data.get('paystack_refnumber')

            if queue_name == ORDER_QUEUE:
                store_incomplete_data(paystack_reference, task_data, 'order')
            elif queue_name == PAYMENT_QUEUE:
                store_incomplete_data(paystack_reference, task_data, 'payment')
            elif queue_name == RESERVATION_QUEUE:
                date_time_str = task_data.get("date_time")
                parsed_datetime = datetime.fromisoformat(date_time_str)

                reservation_date = parsed_datetime.strftime('%Y-%m-%d')
                reservation_time = parsed_datetime.strftime('%H:%M') 
                context = {
                    'recipient_name': task_data.get('name'),
                    'email': task_data.get('email'),
                    'reservation_date': reservation_date,
                    'reservation_time': reservation_time,
                    'guest_count': task_data.get('number_of_guests'),
                }

                reservation_template = load_template(QUEUE_TEMPLATE_MAP[RESERVATION_QUEUE])
                if reservation_template:
                    reservation_content = render_template(reservation_template, context)
                    send_email(context['email'], "Reservation Confirmation", reservation_content)
                    logging.info(f"Reservation confirmation email sent to {context['email']}")

                notify_admin("reservation", context, RESERVATION_QUEUE)
                logging.info("Admin notified of new reservation")
                continue

            merged_data = fetch_and_merge_data(paystack_reference)

            if merged_data:
                context = {
                    'recipient_name': merged_data['recipient_name'],
                    'recipient_address': merged_data['recipient_address'],
                    'recipient_phonenumber': merged_data['recipient_phonenumber'],
                    'email': merged_data['email'],
                    'amount_paid': merged_data['amount_paid'],
                    'order_number': merged_data['order_number'],
                    'order_date': merged_data['order_date'],
                    'paystack_reference': merged_data['paystack_reference'],
                    'order_items': merged_data['order_items'],
                    'payment_method': merged_data['payment_method'],
                    'payment_status': merged_data['payment_status'],
                    'payment_date': merged_data['payment_date'],
                    'recipient_email':merged_data['email']
                }

                recipient_email = merged_data['email']

                order_template = load_template(QUEUE_TEMPLATE_MAP[ORDER_QUEUE])
                if order_template:
                    order_content = render_template(order_template, context)
                    send_email(recipient_email, "Order Confirmation", order_content)
                    logging.info(f"Order confirmation email sent to {recipient_email}")
                
                payment_template = load_template(QUEUE_TEMPLATE_MAP[PAYMENT_QUEUE])
                if payment_template:
                    payment_content = render_template(payment_template, context)
                    send_email(recipient_email, "Payment Confirmation", payment_content)
                    logging.info(f"Payment confirmation email sent to {recipient_email}")

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
