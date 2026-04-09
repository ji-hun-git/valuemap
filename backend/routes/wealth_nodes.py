from fastapi import APIRouter, HTTPException, Query

from backend.data_loader import get_companies, get_country_indicators
from backend.schemas import Company, PagedCompanies

router = APIRouter(prefix="/api/v1/companies", tags=["companies"])


@router.get("", response_model=PagedCompanies)
def list_companies(
    q: str | None = Query(default=None, description="Search by symbol or company name"),
    sector: str | None = Query(default=None),
    country: str | None = Query(default=None),
    min_market_cap: int = Query(default=0, ge=0),
    max_market_cap: int | None = Query(default=None, ge=0),
    sort_by: str = Query(default="market_cap_usd", pattern="^(market_cap_usd|revenue_usd|employees|founded_year|company)$"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PagedCompanies:
    companies = get_companies()

    if q:
        query = q.lower()
        companies = [c for c in companies if query in c.company.lower() or query in c.symbol.lower()]
    if sector:
        companies = [c for c in companies if c.sector.lower() == sector.lower()]
    if country:
        companies = [c for c in companies if c.country.lower() == country.lower()]

    companies = [c for c in companies if c.market_cap_usd >= min_market_cap]
    if max_market_cap is not None:
        companies = [c for c in companies if c.market_cap_usd <= max_market_cap]

    reverse = sort_dir == "desc"
    companies = sorted(companies, key=lambda x: getattr(x, sort_by), reverse=reverse)

    total = len(companies)
    start = (page - 1) * page_size
    end = start + page_size

    return PagedCompanies(total=total, page=page, page_size=page_size, items=companies[start:end])


@router.get("/analytics/overview")
def company_overview() -> dict[str, int]:
    companies = get_companies()
    total_cap = sum(c.market_cap_usd for c in companies)
    total_revenue = sum(c.revenue_usd for c in companies)
    total_employees = sum(c.employees for c in companies)
    return {
        "companies": len(companies),
        "total_market_cap_usd": total_cap,
        "total_revenue_usd": total_revenue,
        "total_employees": total_employees,
    }


@router.get("/analytics/by-sector")
def company_by_sector() -> list[dict[str, int | str]]:
    bucket: dict[str, dict[str, int]] = {}
    for c in get_companies():
        if c.sector not in bucket:
            bucket[c.sector] = {"companies": 0, "market_cap_usd": 0, "revenue_usd": 0}
        bucket[c.sector]["companies"] += 1
        bucket[c.sector]["market_cap_usd"] += c.market_cap_usd
        bucket[c.sector]["revenue_usd"] += c.revenue_usd

    return [
        {
            "sector": sector,
            "companies": values["companies"],
            "market_cap_usd": values["market_cap_usd"],
            "revenue_usd": values["revenue_usd"],
        }
        for sector, values in sorted(bucket.items(), key=lambda item: item[1]["market_cap_usd"], reverse=True)
    ]


@router.get("/analytics/by-country")
def company_by_country() -> list[dict[str, int | str]]:
    bucket: dict[str, dict[str, int]] = {}
    for c in get_companies():
        if c.country not in bucket:
            bucket[c.country] = {"companies": 0, "market_cap_usd": 0, "revenue_usd": 0}
        bucket[c.country]["companies"] += 1
        bucket[c.country]["market_cap_usd"] += c.market_cap_usd
        bucket[c.country]["revenue_usd"] += c.revenue_usd

    return [
        {
            "country": country,
            "companies": values["companies"],
            "market_cap_usd": values["market_cap_usd"],
            "revenue_usd": values["revenue_usd"],
        }
        for country, values in sorted(bucket.items(), key=lambda item: item[1]["market_cap_usd"], reverse=True)
    ]


@router.get("/search/suggestions")
def company_suggestions(q: str = Query(min_length=1, max_length=32)) -> list[dict[str, str]]:
    query = q.lower()
    matches = [c for c in get_companies() if query in c.company.lower() or query in c.symbol.lower()]
    return [{"symbol": c.symbol, "company": c.company} for c in matches[:10]]


@router.get("/country-context")
def country_context() -> list[dict[str, str | int | float]]:
    return get_country_indicators()


@router.get("/{symbol}", response_model=Company)
def get_company(symbol: str) -> Company:
    for company in get_companies():
        if company.symbol.lower() == symbol.lower():
            return company
    raise HTTPException(status_code=404, detail=f"Company '{symbol}' not found")
