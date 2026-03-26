import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, HTMLResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.models.territory import Territory
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


@router.get("/pdf")
async def export_pdf(
    territory_id: int | None = Query(None),
    category: str | None = Query(None),
    lead_status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reporte ejecutivo en HTML (printable PDF via browser)."""
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

    total = len(rows)
    hot = sum(1 for _, p in rows if p and p.lead_status == "hot")
    warm = sum(1 for _, p in rows if p and p.lead_status == "warm")
    cold = sum(1 for _, p in rows if p and p.lead_status == "cold")
    enriched = sum(1 for _, p in rows if p and p.enriched_at)
    avg_score = 0
    scored = [(p.opportunity_score or 0) for _, p in rows if p and p.opportunity_score]
    if scored:
        avg_score = round(sum(scored) / len(scored))

    # Territory name
    territory_name = "All Territories"
    if territory_id:
        t = await db.execute(select(Territory).where(Territory.id == territory_id))
        terr = t.scalar_one_or_none()
        if terr:
            territory_name = terr.name

    # Build rows HTML
    rows_html = ""
    for biz, profile in rows:
        score = profile.opportunity_score if profile else ""
        status = profile.lead_status if profile else ""
        status_color = "#ffb4ab" if status == "hot" else "#adc8f5" if status == "warm" else "#8e9199"
        rows_html += f"""<tr>
            <td>{biz.name}</td>
            <td>{biz.category or ""}</td>
            <td>{biz.address or ""}</td>
            <td style="text-align:center;font-weight:700;">{score}</td>
            <td style="text-align:center;color:{status_color};font-weight:700;">{status.upper() if status else ""}</td>
            <td>{biz.phone or ""}</td>
            <td>{biz.website or ""}</td>
        </tr>"""

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GeoIntel Report - {territory_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap');
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:'Inter',sans-serif; background:#0b1326; color:#dae2fd; padding:40px; }}
  .header {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; padding-bottom:20px; border-bottom:1px solid #43474e; }}
  .logo {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:28px; }}
  .logo span {{ color:#b4c5ff; }}
  .subtitle {{ color:#c4c6cf; font-size:12px; }}
  .date {{ color:#8e9199; font-size:12px; }}
  h2 {{ font-family:'Manrope',sans-serif; font-weight:700; font-size:20px; margin-bottom:8px; }}
  .kpis {{ display:flex; gap:16px; margin-bottom:32px; }}
  .kpi {{ flex:1; background:#131b2e; border-radius:12px; padding:20px; }}
  .kpi-value {{ font-family:'Manrope',sans-serif; font-size:28px; font-weight:800; }}
  .kpi-label {{ color:#c4c6cf; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-top:4px; }}
  .hot {{ color:#ffb4ab; }} .warm {{ color:#adc8f5; }} .cold {{ color:#8e9199; }} .primary {{ color:#b4c5ff; }}
  table {{ width:100%; border-collapse:collapse; margin-top:16px; font-size:12px; }}
  th {{ text-align:left; padding:10px 12px; background:#171f33; color:#c4c6cf; font-size:10px; text-transform:uppercase; letter-spacing:1px; }}
  td {{ padding:10px 12px; border-bottom:1px solid #1a2236; }}
  tr:hover {{ background:#171f33; }}
  .footer {{ margin-top:40px; padding-top:20px; border-top:1px solid #43474e; text-align:center; color:#8e9199; font-size:11px; }}
  @media print {{ body {{ background:white; color:#1a1a1a; }} .kpi {{ background:#f5f5f5; }} th {{ background:#eee; color:#666; }} td {{ border-color:#ddd; }} .hot {{ color:#dc2626; }} .warm {{ color:#d97706; }} .cold {{ color:#6b7280; }} .primary {{ color:#2563eb; }} }}
</style>
</head>
<body>
  <div class="header">
    <div><div class="logo"><span>Geo</span>Intel</div><div class="subtitle">Intelligence Core - Executive Report</div></div>
    <div class="date">Generated: {now}</div>
  </div>
  <h2>{territory_name}</h2>
  <p style="color:#c4c6cf;margin-bottom:24px;">{f"Category: {category}" if category else ""} {f"| Status: {lead_status}" if lead_status else ""}</p>
  <div class="kpis">
    <div class="kpi"><div class="kpi-value primary">{total}</div><div class="kpi-label">Total Businesses</div></div>
    <div class="kpi"><div class="kpi-value primary">{avg_score}</div><div class="kpi-label">Avg Score</div></div>
    <div class="kpi"><div class="kpi-value hot">{hot}</div><div class="kpi-label">Hot Leads</div></div>
    <div class="kpi"><div class="kpi-value warm">{warm}</div><div class="kpi-label">Warm Leads</div></div>
    <div class="kpi"><div class="kpi-value cold">{cold}</div><div class="kpi-label">Cold / No Profile</div></div>
    <div class="kpi"><div class="kpi-value primary">{enriched}</div><div class="kpi-label">Enriched</div></div>
  </div>
  <h2>Business Directory</h2>
  <table>
    <thead><tr><th>Name</th><th>Category</th><th>Address</th><th>Score</th><th>Status</th><th>Phone</th><th>Website</th></tr></thead>
    <tbody>{rows_html}</tbody>
  </table>
  <div class="footer">GeoIntel Intelligence Core &mdash; Confidential Report &mdash; {now}</div>
</body>
</html>"""

    return HTMLResponse(content=html, headers={
        "Content-Disposition": f"inline; filename=geointel_report_{territory_name.replace(' ', '_')}.html",
    })
