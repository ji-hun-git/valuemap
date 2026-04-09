"""Compute market-cap summary statistics from the demo company dataset."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT / "data" / "public" / "wealth_nodes.json"


def main() -> None:
    payload = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))
    companies = payload["companies"]
    market_caps = sorted((company["market_cap_usd"] for company in companies), reverse=True)

    print(f"Company records: {len(companies)}")
    print(f"Largest market cap: {market_caps[0]:,} USD")
    print(f"Median market cap: {market_caps[len(market_caps)//2]:,} USD")
    print(f"Total market cap: {sum(market_caps):,} USD")


if __name__ == "__main__":
    main()
