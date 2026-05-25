"""
PDF Export for Analytics Reports
Uses reportlab for professional PDF generation.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO

from models.user import TokenData
from utils.jwt_utils import get_current_user
from services.db_service import get_db
from routes.history import get_stats  # Reuse stats



router = APIRouter(prefix="/export", tags=["export"])


async def generate_pdf_report(user_email: str) -> BytesIO:
    """Generate comprehensive PDF report."""
    stats = await get_stats(current_user=TokenData(email=user_email, role="user"))

    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.darkblue,
        alignment=1  # Center
    )
    
    story = []
    
    # Header
    story.append(Paragraph("Sentiment Analytics Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 0.5*inch))
    
    # KPIs Table
    total = stats["total"]
    data = [
        ["Metric", "Value"],
        ["Total Analyses", str(total)],
        ["Positive %", f"{stats['distribution'].get('Positive', 0) / total * 100:.1f}%" if total else "0%"],
        ["Negative %", f"{stats['distribution'].get('Negative', 0) / total * 100:.1f}%" if total else "0%"],
    ]
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)
    
    # Top Issues
    if 'top_negative_keywords' in stats and stats['top_negative_keywords']:
        story.append(Paragraph("Top Negative Keywords", styles['Heading2']))
        kw_data = [["Keyword", "Count"]] + [
            [kw["keyword"], str(kw["count"])] for kw in stats['top_negative_keywords'][:5]
        ]
        kw_table = Table(kw_data)
        kw_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.red),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(kw_table)
    
    # Model Usage
    story.append(Paragraph("Model Performance", styles['Heading2']))
    model_data = [["Model", "Usage %"]]
    for model, count in stats.get('model_usage', {}).items():
        model_data.append([model, f"{count/total*100:.1f}%" if total else "0"])
    model_table = Table(model_data)
    model_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))
    story.append(model_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/report/pdf")
async def export_pdf_report(
    title: Optional[str] = "Sentiment Report",
    current_user: TokenData = Depends(get_current_user)
):
    """Download PDF analytics report."""
    buffer = await generate_pdf_report(current_user.email)
    
    filename = f"sentiment_report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

