# 🌍 Atlas of Value

Atlas of Value is an interactive macro-intelligence platform that visualizes global corporate wealth, live mobility, and cross-border value flows on a 3D Earth interface.

## What was fixed in this pass

- **Earth map visibility fix:** CSP/security headers now allow Cesium CDN assets so globe rendering works in-browser.
- **Realtime stock visibility:** dedicated live stocks table fed by `GET /api/v1/live/companies`.
- **Data discoverability:** added `GET /api/v1/data/catalog` + `GET /api/v1/data/{dataset}` so all datasets are directly browsable via API.
- **Live value map arcs + AOE index:** flows are shown as globe arcs with active pulse metrics.
- **AI Copilot interaction:** natural-language prompts can trigger map focus actions.

## APIs

### Companies
- `GET /api/v1/companies`
- `GET /api/v1/companies/{symbol}`
- `GET /api/v1/companies/search/suggestions`
- `GET /api/v1/companies/country-context`
- `GET /api/v1/companies/analytics/overview`
- `GET /api/v1/companies/analytics/by-sector`
- `GET /api/v1/companies/analytics/by-country`

### Trade Flows
- `GET /api/v1/trade-flows`
- `GET /api/v1/trade-flows/analytics/top-routes`
- `GET /api/v1/trade-flows/analytics/corridors`
- `GET /api/v1/trade-flows/map/arcs`
- `GET /api/v1/trade-flows/sources`

### Realtime + AI
- `GET /api/v1/live/companies`
- `GET /api/v1/live/aircraft`
- `GET /api/v1/live/value-flows`
- `WS /api/v1/live/ws`
- `POST /api/v1/ai/ask`

### Data Catalog
- `GET /api/v1/data/catalog`
- `GET /api/v1/data/{dataset_name}`

## Launch locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000`.

## Connected data

- Yahoo Finance quote endpoint (+ Stooq fallback for quote coverage)
- OpenSky Network ADS-B
- UN Comtrade+
- World Bank Data
- SEC EDGAR
- CompaniesMarketCap
- OpenCorporates
- Natural Earth / GeoNames / OpenStreetMap references

## Governance

- `LICENSE` (MIT)
- `PRIVACY.md`
- `SECURITY.md`
