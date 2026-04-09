# 🌍 Atlas of Value

Atlas of Value is an interactive macro-intelligence platform that visualizes global corporate wealth, live mobility, and cross-border value flows on a 3D Earth interface.

## Supercharged features now included

- **Google-Earth-like globe mode** powered by Cesium with interactive entities.
- **Realtime market overlays** (Yahoo Finance quotes) on real HQ coordinates.
- **Realtime aircraft layer** (OpenSky ADS-B state vectors).
- **Realtime value-flow arcs** with AOE Index updates.
- **AI Copilot interactions** for natural-language questions + map focus actions.
- **Company/trade analytics APIs** with filtering, search, and drill-down.
- **Safety baseline** with rate limiting + security headers + privacy/security docs.

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

## Launch locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000`.

## Connected data

- Yahoo Finance quote endpoint
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
