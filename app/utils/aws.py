"""AWS utilities for S3 operations."""
import os

import boto3


def create_session() -> boto3.Session:
    """Create a boto3 session for AWS operations."""
    session = boto3.Session(
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REIGION"),
    )

    return session
