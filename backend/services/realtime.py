from __future__ import annotations

import json
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "public"

QUOTE_CACHE: dict[str, object] = {"ts": 0.0, "data": []}
CACHE_SECONDS = 20


def _load_live_companies() -> list[dict[str, object]]:
    payload = json.loads((DATA_DIR / "live_companies.json").read_text(encoding="utf-8"))
    return payload["companies"]


async def fetch_live_company_quotes() -> list[dict[str, object]]:
    now = time.time()
    if now - float(QUOTE_CACHE["ts"]) < CACHE_SECONDS and QUOTE_CACHE["data"]:
        return QUOTE_CACHE["data"]  # type: ignore[return-value]

    companies = _load_live_companies()
    symbols = ",".join(company["symbol"] for company in companies)
    url = "https://query1.finance.yahoo.com/v7/finance/quote"

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(url, params={"symbols": symbols})
            response.raise_for_status()
            quote_rows = response.json().get("quoteResponse", {}).get("result", [])
    except Exception:
        quote_rows = []

    by_symbol = {row.get("symbol"): row for row in quote_rows if row.get("symbol")}
    enriched = []
    for company in companies:
        quote = by_symbol.get(company["symbol"], {})
        enriched.append(
            {
                **company,
                "price": quote.get("regularMarketPrice"),
                "market_cap": quote.get("marketCap"),
                "change_percent": quote.get("regularMarketChangePercent"),
                "currency": quote.get("currency", "USD"),
                "quote_time": quote.get("regularMarketTime"),
            }
        )

    QUOTE_CACHE["ts"] = now
    QUOTE_CACHE["data"] = enriched
    return enriched


async def fetch_live_air_traffic(limit: int = 60) -> list[dict[str, object]]:
    """Fetches publicly available ADS-B state vectors from OpenSky.

    If upstream is unavailable/rate-limited, returns an empty list.
    """

    try:
        async with httpx.AsyncClient(timeout=7.0) as client:
            response = await client.get("https://opensky-network.org/api/states/all")
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    states = payload.get("states") or []
    flights: list[dict[str, object]] = []
    for row in states:
        if not row or row[5] is None or row[6] is None:
            continue
        flights.append(
            {
                "icao24": row[0],
                "callsign": (row[1] or "").strip(),
                "origin_country": row[2],
                "longitude": row[5],
                "latitude": row[6],
                "baro_altitude": row[7],
                "velocity": row[9],
                "heading": row[10],
            }
        )
        if len(flights) >= limit:
            break

    return flights
