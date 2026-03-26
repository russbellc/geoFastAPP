from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.businesses import router as businesses_router
from app.api.v1.competitors import router as competitors_router
from app.api.v1.exports import router as exports_router
from app.api.v1.scans import router as scans_router
from app.api.v1.search import router as search_router
from app.api.v1.stats import router as stats_router
from app.api.v1.webhooks import router as webhooks_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(scans_router)
api_router.include_router(businesses_router)
api_router.include_router(search_router)
api_router.include_router(stats_router)
api_router.include_router(exports_router)
api_router.include_router(competitors_router)
api_router.include_router(webhooks_router)
