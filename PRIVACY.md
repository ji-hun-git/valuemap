# Privacy Notice (Development Build)

_Last updated: April 9, 2026_

Atlas of Value in this repository is a development/demo build.

## What this app stores

- Public market/trade demo datasets committed in `data/public`.
- In-memory request metadata for rate limiting (client IP + timestamp window).

## What this app does **not** store by default

- No user account credentials.
- No payment card data.
- No persistent analytics profile store.

## API requests

When you call the API, the service may temporarily process:

- Source IP address (for safety rate limits)
- Request path, query params, and standard HTTP metadata

The default implementation does **not** persist this to a database.

## Third-party/public sources

Demo datasets include references to public/open data sources (e.g., World Bank, UN Comtrade, SEC EDGAR).
Downstream users are responsible for complying with each source's terms.

## Future production guidance

Before production deployment, add:

- Formal data retention/deletion policy
- Consent and cookie disclosure
- DPA/processor inventory
- Regional compliance controls (GDPR/CCPA/etc.)
