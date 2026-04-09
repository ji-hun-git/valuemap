from fastapi import APIRouter, Query

from backend.data_loader import get_country_centroids, get_data_sources, get_trade_flows
from backend.schemas import TradeFlow

router = APIRouter(prefix="/api/v1/trade-flows", tags=["trade-flows"])


@router.get("", response_model=list[TradeFlow])
def list_trade_flows(
    commodity: str | None = Query(default=None, description="Filter by commodity"),
    source_country: str | None = Query(default=None),
    target_country: str | None = Query(default=None),
    min_value_usd: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[TradeFlow]:
    flows = [flow for flow in get_trade_flows() if flow.value_usd >= min_value_usd]
    if commodity:
        flows = [flow for flow in flows if flow.commodity.lower() == commodity.lower()]
    if source_country:
        flows = [flow for flow in flows if flow.source_country.lower() == source_country.lower()]
    if target_country:
        flows = [flow for flow in flows if flow.target_country.lower() == target_country.lower()]
    return sorted(flows, key=lambda x: x.value_usd, reverse=True)[:limit]


@router.get("/analytics/top-routes")
def top_routes(limit: int = Query(default=15, ge=1, le=100)) -> list[dict[str, str | int]]:
    flows = sorted(get_trade_flows(), key=lambda x: x.value_usd, reverse=True)[:limit]
    return [
        {
            "id": flow.id,
            "commodity": flow.commodity,
            "source_country": flow.source_country,
            "target_country": flow.target_country,
            "value_usd": flow.value_usd,
        }
        for flow in flows
    ]


@router.get("/analytics/corridors")
def trade_corridors() -> list[dict[str, str | int]]:
    bucket: dict[tuple[str, str], int] = {}
    for flow in get_trade_flows():
        key = (flow.source_country, flow.target_country)
        bucket[key] = bucket.get(key, 0) + flow.value_usd

    return [
        {"source_country": src, "target_country": dst, "total_value_usd": value}
        for (src, dst), value in sorted(bucket.items(), key=lambda item: item[1], reverse=True)[:20]
    ]


@router.get("/map/arcs")
def map_arcs(limit: int = Query(default=40, ge=1, le=300)) -> list[dict[str, object]]:
    centroids = get_country_centroids()
    flows = sorted(get_trade_flows(), key=lambda x: x.value_usd, reverse=True)[:limit]
    rows: list[dict[str, object]] = []
    for flow in flows:
        src = centroids.get(flow.source_country)
        dst = centroids.get(flow.target_country)
        if not src or not dst:
            continue
        rows.append(
            {
                "id": flow.id,
                "commodity": flow.commodity,
                "value_usd": flow.value_usd,
                "source_country": flow.source_country,
                "target_country": flow.target_country,
                "source": src,
                "target": dst,
            }
        )
    return rows


@router.get("/sources")
def trade_sources() -> list[dict[str, str]]:
    return get_data_sources().get("trade_flows", [])
