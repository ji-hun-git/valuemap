from __future__ import annotations

from backend.data_loader import get_companies, get_trade_flows


def answer_question(prompt: str) -> dict[str, object]:
    text = prompt.lower()
    companies = get_companies()
    flows = get_trade_flows()

    if "largest" in text and "company" in text:
        top = max(companies, key=lambda c: c.market_cap_usd)
        return {
            "answer": f"Largest company in the dataset is {top.company} ({top.symbol}) at ${top.market_cap_usd:,.0f} market cap.",
            "actions": [{"type": "focus_company", "symbol": top.symbol}],
        }

    if "flow" in text or "trade" in text:
        top_flow = max(flows, key=lambda f: f.value_usd)
        return {
            "answer": f"Top value flow right now is {top_flow.commodity} from {top_flow.source_country} to {top_flow.target_country} (~${top_flow.value_usd:,.0f}).",
            "actions": [{"type": "focus_flow", "id": top_flow.id}],
        }

    if "country" in text:
        by_country: dict[str, int] = {}
        for c in companies:
            by_country[c.country] = by_country.get(c.country, 0) + c.market_cap_usd
        top_country, value = sorted(by_country.items(), key=lambda item: item[1], reverse=True)[0]
        return {
            "answer": f"Top country by aggregate company value is {top_country} at about ${value:,.0f}.",
            "actions": [{"type": "focus_country", "country": top_country}],
        }

    return {
        "answer": "Try asking: 'largest company', 'top trade flow', or 'top country by value'.",
        "actions": [],
    }
