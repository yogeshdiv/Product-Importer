"""Celery application configuration."""
import os

from celery import Celery

BROKER_URL = os.getenv("CELERY_BROKER_URL")
celery_app: Celery = Celery('product_importer', broker=BROKER_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
)
celery_app.autodiscover_tasks(packages=["app.tasks.csv_task"])
