"""Helpers for loading local public demo datasets."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from backend.schemas import Company, TradeFlow

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA_DIR = ROOT / "data" / "public"


@lru_cache
def get_companies() -> list[Company]:
    with (PUBLIC_DATA_DIR / "wealth_nodes.json").open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return [Company.model_validate(item) for item in payload["companies"]]


@lru_cache
def get_trade_flows() -> list[TradeFlow]:
    with (PUBLIC_DATA_DIR / "trade_flows.json").open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return [TradeFlow.model_validate(item) for item in payload["flows"]]


@lru_cache
def get_country_indicators() -> list[dict[str, str | int | float]]:
    with (PUBLIC_DATA_DIR / "country_indicators.json").open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return payload["indicators"]


@lru_cache
def get_data_sources() -> dict[str, list[dict[str, str]]]:
    with (PUBLIC_DATA_DIR / "data_sources.json").open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return payload


@lru_cache
def get_country_centroids() -> dict[str, dict[str, float]]:
    with (PUBLIC_DATA_DIR / "country_centroids.json").open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return payload["centroids"]
