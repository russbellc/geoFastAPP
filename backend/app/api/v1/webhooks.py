import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.api_key import ApiKey, Webhook
from app.models.user import User

router = APIRouter(tags=["Webhooks & API Keys"])

# ---- Webhook Endpoints ----

VALID_EVENTS = ["lead.hot", "scan.completed", "competitor.new", "business.enriched"]


class WebhookCreate(BaseModel):
    url: str
    events: list[str]


class WebhookResponse(BaseModel):
    id: int
    url: str
    events: list[str]
    active: bool
    secret: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/webhooks", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    data: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registrar webhook para recibir eventos."""
    invalid = [e for e in data.events if e not in VALID_EVENTS]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid events: {invalid}. Valid: {VALID_EVENTS}",
        )

    secret = secrets.token_hex(32)
    webhook = Webhook(
        user_id=current_user.id,
        url=data.url,
        events=data.events,
        secret=secret,
        active=True,
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)

    resp = WebhookResponse.model_validate(webhook)
    resp.secret = secret  # show secret only on creation
    return resp


@router.get("/webhooks", response_model=list[WebhookResponse])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar webhooks del usuario."""
    result = await db.execute(
        select(Webhook).where(Webhook.user_id == current_user.id)
    )
    hooks = result.scalars().all()
    return [WebhookResponse(
        id=h.id, url=h.url, events=h.events, active=h.active,
        created_at=h.created_at,
    ) for h in hooks]


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Eliminar webhook."""
    result = await db.execute(
        select(Webhook).where(Webhook.id == webhook_id, Webhook.user_id == current_user.id)
    )
    hook = result.scalar_one_or_none()
    if not hook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    await db.delete(hook)
    await db.commit()


# ---- API Key Endpoints ----

class ApiKeyCreate(BaseModel):
    name: str
    permissions: list[str] | None = None


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    permissions: list[str] | None
    active: bool
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyResponse):
    key: str  # full key, shown only once


@router.post("/api-keys", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crear API key. La key completa solo se muestra una vez."""
    raw_key = f"geoink_{secrets.token_hex(24)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    api_key = ApiKey(
        user_id=current_user.id,
        key_hash=key_hash,
        key_prefix=raw_key[:12],
        name=data.name,
        permissions=data.permissions or ["read"],
        active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        permissions=api_key.permissions,
        active=api_key.active,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
        key=raw_key,
    )


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar API keys del usuario."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == current_user.id)
    )
    return result.scalars().all()


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revocar API key."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.active = False
    await db.commit()
