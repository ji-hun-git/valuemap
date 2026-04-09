# 🌍 Atlas of Value

Atlas of Value is a company-level geospatial intelligence platform that transforms global macro/market data into an interactive economic command center.

## What is now implemented

- **Scaled company dataset:** 180 company records with market cap, revenue, workforce, sector, and geolocation metadata.
- **Connected open-source context data:** country macro indicators + source catalog for auditability.
- **Backend API for company intelligence:** rich filtering, sorting, pagination, detail lookup, and analytics aggregations.
- **Large trade-flow API:** 120 routes plus route analytics/corridors and source metadata endpoints.
- **Beautiful web UI/UX:** glassmorphism dashboard with KPI cards, sector visualization, country context, source panel, dynamic search suggestions, and paginated directory.
- **Safety baseline:** in-memory rate limiting, secure response headers, typed input validation, privacy + security docs.

## API surface

### Companies
- `GET /api/v1/companies`
  - Query params: `q`, `sector`, `country`, `min_market_cap`, `max_market_cap`, `sort_by`, `sort_dir`, `page`, `page_size`
- `GET /api/v1/companies/{symbol}`
- `GET /api/v1/companies/search/suggestions`
- `GET /api/v1/companies/country-context`
- `GET /api/v1/companies/analytics/overview`
- `GET /api/v1/companies/analytics/by-sector`
- `GET /api/v1/companies/analytics/by-country`

### Trade Flows
- `GET /api/v1/trade-flows`
  - Query params: `commodity`, `source_country`, `target_country`, `min_value_usd`, `limit`
- `GET /api/v1/trade-flows/analytics/top-routes`
- `GET /api/v1/trade-flows/analytics/corridors`
- `GET /api/v1/trade-flows/sources`

### Health + Web
- `GET /health`
- `GET /` (launches the dashboard)

## Launch locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Then open: `http://127.0.0.1:8000`

## Governance / Trust

- `LICENSE` (MIT)
- `PRIVACY.md` (development privacy notice)
- `SECURITY.md` (security and safety posture)

## Data notes

- `data/public/wealth_nodes.json`: scaled demo dataset for company-level product development.
- `data/public/trade_flows.json`: scaled trade-flow dataset for analytics and flow UX testing.
- `data/public/country_indicators.json`: open macro context indicators.
- `data/public/data_sources.json`: connected public/open-source data catalog.
- Datasets are development-safe demo records intended for rapid prototyping and UX iteration.
