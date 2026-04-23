import os
import json
import logging
import aio_pika
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class RabbitMQManager:
    def __init__(self):
        self.url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
        self.connection = None
        self.channel = None
        self.exchange = None
        self.exchange_name = "campaign_exchange"
        self.queue_name = "bulk_email_queue"

    async def connect(self):
        """Establish connection to RabbitMQ"""
        if self.connection and not self.connection.is_closed:
            return

        try:
            self.connection = await aio_pika.connect_robust(self.url)
            self.channel = await self.connection.channel()
            
            # Setup Exchange (Topic or Direct depending on needs, using Direct for simplicity)
            self.exchange = await self.channel.declare_exchange(
                self.exchange_name, aio_pika.ExchangeType.DIRECT, durable=True
            )
            
            # Setup Quorum Queue for high availability (reverting to classic if quorum not supported locally)
            queue = await self.channel.declare_queue(
                self.queue_name, 
                durable=True,
                # arguments={"x-queue-type": "quorum"} # Uncomment in production cluster
            )
            
            # Bind Queue to Exchange
            await queue.bind(self.exchange, routing_key="email.send")
            
            # --- Phase 7.5: Setup Background Jobs Exchange and Queue ---
            self.bg_exchange = await self.channel.declare_exchange(
                "background_exchange", aio_pika.ExchangeType.DIRECT, durable=True
            )
            bg_queue = await self.channel.declare_queue("background_tasks", durable=True)
            await bg_queue.bind(self.bg_exchange, routing_key="task.process")

            # Dedicated Import Queue
            import_queue = await self.channel.declare_queue("import_tasks", durable=True)
            await import_queue.bind(self.bg_exchange, routing_key="task.import")
            
            logger.info("Successfully connected to RabbitMQ and declared queues.")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def publish_tasks(self, tasks: List[Dict[str, Any]]):
        """Publish a batch of email tasks to the queue"""
        if not self.exchange:
            await self.connect()

        for task in tasks:
            message = aio_pika.Message(
                body=json.dumps(task).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )
            await self.exchange.publish(message, routing_key="email.send")
            
        logger.info(f"Published {len(tasks)} messages to RabbitMQ")

    async def publish_background_task(self, payload: Dict[str, Any], routing_key: str = "task.process"):
        """Publish a generic background task (like CSV import)"""
        if not hasattr(self, 'bg_exchange') or not self.bg_exchange:
            await self.connect()
            
        message = aio_pika.Message(
            body=json.dumps(payload).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )
        await self.bg_exchange.publish(message, routing_key=routing_key)
        logger.info(f"Published background task {payload.get('task_type')} to RabbitMQ via {routing_key}")

    async def close(self):
        """Close connection gracefully"""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()

mq_client = RabbitMQManager()
