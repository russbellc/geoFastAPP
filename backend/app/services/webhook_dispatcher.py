"""Webhook dispatcher — envia eventos a URLs registradas con retry."""

import hashlib
import hmac
import json
import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import Webhook

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


async def dispatch_event(db: AsyncSession, event: str, payload: dict):
    """Envia un evento a todos los webhooks registrados para ese tipo."""
    result = await db.execute(
        select(Webhook).where(Webhook.active == True)  # noqa: E712
    )
    webhooks = result.scalars().all()

    for hook in webhooks:
        events = hook.events or []
        if event not in events:
            continue

        body = json.dumps({"event": event, "data": payload})
        signature = hmac.new(
            hook.secret.encode(), body.encode(), hashlib.sha256
        ).hexdigest()

        headers = {
            "Content-Type": "application/json",
            "X-GeoIntel-Event": event,
            "X-GeoIntel-Signature": signature,
        }

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(hook.url, content=body, headers=headers)
                    if response.status_code < 300:
                        logger.info(f"Webhook {hook.id} delivered: {event} -> {hook.url}")
                        break
                    logger.warning(
                        f"Webhook {hook.id} returned {response.status_code} (attempt {attempt})"
                    )
            except Exception as e:
                logger.warning(f"Webhook {hook.id} failed (attempt {attempt}): {e}")

            if attempt == MAX_RETRIES:
                logger.error(f"Webhook {hook.id} exhausted retries for {event}")
