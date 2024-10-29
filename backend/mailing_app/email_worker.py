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
import email.utils

# Load environment variables from .env file
load_dotenv()

# Set up Redis client with decoding to handle strings
redis_client = redis.StrictRedis(host='localhost', port=6379, decode_responses=True)

# SMTP email server configuration
SMTP_SERVER = os.getenv('SMTP_SERVER')          # e.g., 'us2.outbound.mailhostbox.com'
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))    # Typically 587 for TLS
SMTP_USER = os.getenv('SMTP_USER')              # e.g., 'noreply@grublanerestaurant.com'
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')      # Ensure this is secure

# Redis queue names for reservations, payments, and orders
RESERVATION_QUEUE = os.getenv('RESERVATION_QUEUE')  # e.g., 'reservation_queue'
PAYMENT_QUEUE = os.getenv('PAYMENT_QUEUE')          # e.g., 'payment_queue'
ORDER_QUEUE = os.getenv('ORDER_QUEUE')              # e.g., 'order_queue'

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
    """Load an email template from the TEMPLATE_DIR."""
    template_path = os.path.join(TEMPLATE_DIR, template_name)
    try:
        with open(template_path, 'r', encoding='utf-8') as template_file:
            return template_file.read()
    except FileNotFoundError:
        logging.error(f"Template {template_name} not found in {TEMPLATE_DIR}")
        return None

def render_template(template, context):
    """Replace placeholders in the template with context data."""
    for key, value in context.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template

def send_email(recipient_email, subject, body):
    """Send an email with the specified subject and body to the recipient."""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = recipient_email
        msg['Subject'] = subject

        # Generate a unique Message-ID
        msg['Message-ID'] = email.utils.make_msgid(domain="grublanerestaurant.com")
        msg['Date'] = email.utils.formatdate(localtime=True)

        # Attach the email body
        msg.attach(MIMEText(body, 'html'))

        # Connect to the SMTP server and send the email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logging.info(f"Email sent to {recipient_email}")

    except Exception as e:
        logging.error(f"Failed to send email to {recipient_email}: {e}")

def notify_admin(action_type, context, queue_name):
    """Send a notification email to the admin based on the action type."""
    admin_template = ADMIN_TEMPLATE_MAP.get(queue_name)
    if not admin_template:
        logging.error(f"No admin template mapped for queue: {queue_name}")
        return

    subject = f"New {action_type.capitalize()} Notification"
    body = render_template(load_template(admin_template), context)
    send_email(ADMIN_EMAIL, subject, body)

def format_datetime(datetime_str):
    """
    Converts ISO 8601 datetime string to a human-readable format: YYYY-MM-DD HH:MM.
    If the string is empty or invalid, return 'N/A'.
    """
    try:
        # Use strptime instead of fromisoformat
        parsed_date = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
        return parsed_date.strftime('%Y-%m-%d %H:%M')
    except (ValueError, TypeError):
        return 'N/A'

def store_incomplete_data(reference, data, queue_type):
    """
    Store order or payment data in Redis using paystack_reference as the key.
    Set an expiration time to avoid stale data.
    """
    redis_client.hset(f"transaction:{reference}", queue_type, json.dumps(data))
    redis_client.expire(f"transaction:{reference}", 3600)  # Data expires in 1 hour

def fetch_and_merge_data(reference):
    """
    Fetch order and payment data from Redis using the paystack_reference key.
    If both are available, merge them into a unified context.
    """
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
    
    return None  # Data is incomplete, still waiting for the other part

def email_worker(queue_name):
    """Worker function to process emails from Redis queues."""
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
                try:
                    # Use strptime to parse the datetime string
                    parsed_datetime = datetime.strptime(date_time_str, '%Y-%m-%d %H:%M')
                except ValueError:
                    logging.error(f"Invalid date_time format: {date_time_str}")
                    parsed_datetime = None

                if parsed_datetime:
                    reservation_date = parsed_datetime.strftime('%Y-%m-%d')
                    reservation_time = parsed_datetime.strftime('%H:%M') 
                    print(task_data)
                    context = {
                        'recipient_name': task_data.get('name'),
                        'email': task_data.get('email'),
                        'reservation_date': reservation_date,
                        'reservation_time': reservation_time,
                        'guest_count': task_data.get('number_of_guests'),
                        'action_type': 'reservation',
                    }

                    reservation_template = load_template(QUEUE_TEMPLATE_MAP[RESERVATION_QUEUE])
                    if reservation_template:
                        reservation_content = render_template(reservation_template, context)
                        send_email(context['email'], "Reservation Confirmation", reservation_content)
                        logging.info(f"Reservation confirmation email sent to {context['email']}")

                    # Notify admin about the reservation
                    notify_admin("reservation", context, RESERVATION_QUEUE)
                    logging.info("Admin notified of new reservation")
                else:
                    logging.error(f"Failed to parse date_time_str: {date_time_str}")
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
                    'recipient_email': merged_data['email']
                }

                recipient_email = merged_data['email']

                # Send the order confirmation email
                order_template = load_template(QUEUE_TEMPLATE_MAP[ORDER_QUEUE])
                if order_template:
                    order_content = render_template(order_template, context)
                    send_email(recipient_email, "Order Confirmation", order_content)
                    logging.info(f"Order confirmation email sent to {recipient_email}")
                
                # Send the payment confirmation email
                payment_template = load_template(QUEUE_TEMPLATE_MAP[PAYMENT_QUEUE])
                if payment_template:
                    payment_content = render_template(payment_template, context)
                    send_email(recipient_email, "Payment Confirmation", payment_content)
                    logging.info(f"Payment confirmation email sent to {recipient_email}")

                # Notify admin after sending order and payment confirmations
                notify_admin(queue_name.capitalize(), context, queue_name)

def start_workers():
    """Start email workers for each queue in separate threads."""
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
