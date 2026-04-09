"""Inspect company coverage stats from the public company dataset."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT / "data" / "public" / "wealth_nodes.json"


def main() -> None:
    payload = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))
    companies = payload["companies"]
    sectors = Counter(company["sector"] for company in companies)
    countries = Counter(company["country"] for company in companies)

    print(f"Companies loaded: {len(companies)}")
    print("Top sectors:")
    for sector, count in sectors.most_common(5):
        print(f"- {sector}: {count}")

    print("Top countries:")
    for country, count in countries.most_common(5):
        print(f"- {country}: {count}")


if __name__ == "__main__":
    main()
