from pydantic import BaseModel


class Company(BaseModel):
    symbol: str
    company: str
    city: str
    country: str
    sector: str
    latitude: float
    longitude: float
    market_cap_usd: int
    employees: int
    revenue_usd: int
    founded_year: int


class TradeFlow(BaseModel):
    id: int
    commodity: str
    source_country: str
    target_country: str
    value_usd: int
    year: int


class PagedCompanies(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[Company]
