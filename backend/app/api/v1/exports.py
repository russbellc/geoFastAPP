import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.models.user import User

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/csv")
async def export_csv(
    territory_id: int | None = Query(None),
    category: str | None = Query(None),
    lead_status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exportar negocios a CSV."""
    query = select(Business, BusinessProfile).outerjoin(
        BusinessProfile, Business.id == BusinessProfile.business_id
    )

    if territory_id:
        query = query.where(Business.territory_id == territory_id)
    if category:
        query = query.where(Business.category == category)
    if lead_status:
        query = query.where(BusinessProfile.lead_status == lead_status)

    result = await db.execute(query)
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Nombre", "Categoria", "Subcategoria", "Direccion",
        "Telefono", "Website", "Email", "Score", "Lead Status",
        "SEO Score", "Tiene Booking", "Tiene Chatbot",
    ])

    for business, profile in rows:
        writer.writerow([
            business.id,
            business.name,
            business.category,
            business.subcategory,
            business.address,
            business.phone,
            business.website,
            business.email,
            profile.opportunity_score if profile else "",
            profile.lead_status if profile else "",
            profile.seo_score if profile else "",
            profile.has_online_booking if profile else "",
            profile.has_chatbot if profile else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=geointel_export.csv"},
    )
