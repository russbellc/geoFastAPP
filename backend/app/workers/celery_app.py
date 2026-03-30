import os

from celery import Celery
from celery.schedules import crontab

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "geointel",
    broker=redis_url,
    backend=redis_url,
    include=["app.workers.scan_tasks", "app.workers.enrich_tasks", "app.workers.competitor_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Lima",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "rescan-stale-territories": {
            "task": "rescan_stale_territories",
            "schedule": crontab(hour=3, minute=0),  # daily at 3 AM, checks for 30+ day old scans
        },
    },
)
