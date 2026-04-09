# Security & Safety Measures

_Last updated: April 9, 2026_

## Implemented in this repository

- Input validation with constrained query parameters and typed schemas (Pydantic).
- In-memory IP-based request throttling middleware.
- Secure HTTP response headers middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`).
- CORS middleware enabled for development compatibility.

## Safe development defaults

- No secrets committed in source control (`.env` ignored).
- Local data folders separated from raw/processed pipeline artifacts.
- Public demo datasets are explicitly marked as development sample data.

## Recommended next hardening steps

- Replace permissive CORS with explicit allowed origins.
- Add authentication/authorization for premium endpoints.
- Add signed API keys for enterprise access.
- Add persistent audit logging + SIEM integration.
- Add dependency scanning and SAST in CI.

## Reporting security issues

Please report vulnerabilities privately to project maintainers and avoid public disclosure before a patch is available.
