"""Summarize trade-flow coverage and value from the public dataset."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT / "data" / "public" / "trade_flows.json"


def main() -> None:
    payload = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))
    flows = payload["flows"]
    by_commodity = Counter(flow["commodity"] for flow in flows)
    total = sum(flow["value_usd"] for flow in flows)

    print(f"Trade flows loaded: {len(flows)}")
    print(f"Total value (USD): {total:,}")
    print("Top commodities:")
    for commodity, count in by_commodity.most_common(5):
        print(f"- {commodity}: {count} routes")


if __name__ == "__main__":
    main()
