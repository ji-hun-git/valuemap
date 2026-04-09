from __future__ import annotations

import asyncio
import random
import time

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from backend.data_loader import get_trade_flows
from backend.services.realtime import (
    fetch_live_air_traffic,
    fetch_live_bitcoin,
    fetch_live_company_quotes,
)

router = APIRouter(prefix="/api/v1/live", tags=["realtime"])


@router.get("/companies")
async def live_companies() -> dict[str, object]:
    rows = await fetch_live_company_quotes()
    return {"as_of_epoch": int(time.time()), "count": len(rows), "items": rows}


@router.get("/bitcoin")
async def live_bitcoin() -> dict[str, object]:
    btc = await fetch_live_bitcoin()
    return {"as_of_epoch": int(time.time()), "item": btc}


@router.get("/aircraft")
async def live_aircraft(limit: int = Query(default=60, ge=1, le=300)) -> dict[str, object]:
    rows = await fetch_live_air_traffic(limit=limit)
    return {"as_of_epoch": int(time.time()), "count": len(rows), "items": rows}


@router.get("/value-flows")
async def live_value_flows(limit: int = Query(default=40, ge=1, le=200)) -> dict[str, object]:
    """Realtime-ish value flows with tiny volatility jitter for animation cadence."""
    flows = sorted(get_trade_flows(), key=lambda x: x.value_usd, reverse=True)[:limit]
    rows = []
    aoe_score = 0.0
    for flow in flows:
        jitter = 1 + random.uniform(-0.015, 0.015)
        live_value = int(flow.value_usd * jitter)
        aoe_score += live_value / 1_000_000_000
        rows.append(
            {
                "id": flow.id,
                "commodity": flow.commodity,
                "source_country": flow.source_country,
                "target_country": flow.target_country,
                "value_usd": live_value,
            }
        )

    return {
        "as_of_epoch": int(time.time()),
        "aoe_index": round(aoe_score, 2),
        "count": len(rows),
        "items": rows,
    }


@router.websocket("/ws")
async def live_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            companies, flights, bitcoin = await asyncio.gather(
                fetch_live_company_quotes(),
                fetch_live_air_traffic(limit=50),
                fetch_live_bitcoin(),
            )
            flows = await live_value_flows(limit=30)
            await websocket.send_json(
                {
                    "as_of_epoch": int(time.time()),
                    "companies": companies,
                    "aircraft": flights,
                    "bitcoin": bitcoin,
                    "flows": flows,
                }
            )
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        return
