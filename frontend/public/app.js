const state = {
  page: 1,
  pageSize: 20,
};

function usd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function compact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function buildQuery() {
  const params = new URLSearchParams({
    page: String(state.page),
    page_size: String(state.pageSize),
    sort_by: "market_cap_usd",
    sort_dir: "desc",
    min_market_cap: document.getElementById("min_market_cap").value || "0",
  });

  const q = document.getElementById("q").value.trim();
  const sector = document.getElementById("sector").value;
  const country = document.getElementById("country").value;

  if (q) params.set("q", q);
  if (sector) params.set("sector", sector);
  if (country) params.set("country", country);

  return params.toString();
}

function renderKpis(overview) {
  const el = document.getElementById("kpis");
  const cards = [
    ["Companies", compact(overview.companies)],
    ["Total Market Cap", usd(overview.total_market_cap_usd)],
    ["Total Revenue", usd(overview.total_revenue_usd)],
    ["Total Employees", compact(overview.total_employees)],
  ];

  el.innerHTML = cards
    .map(
      ([label, value]) => `
      <article class="kpi-card glass">
        <p>${label}</p>
        <h3>${value}</h3>
      </article>
    `,
    )
    .join("");
}

function renderSectorChart(rows) {
  const max = Math.max(...rows.map((r) => r.market_cap_usd));
  const chart = document.getElementById("sector-chart");

  chart.innerHTML = rows
    .slice(0, 8)
    .map((row) => {
      const width = Math.max(2, Math.round((row.market_cap_usd / max) * 100));
      return `
        <div class="bar-row">
          <div class="bar-label">${row.sector}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <div class="bar-value">${usd(row.market_cap_usd)}</div>
        </div>
      `;
    })
    .join("");
}

function renderCompanies(payload) {
  const tbody = document.querySelector("#companies-table tbody");
  tbody.innerHTML = payload.items
    .map(
      (company) => `
      <tr>
        <td>${company.symbol}</td>
        <td>${company.company}</td>
        <td>${company.sector}</td>
        <td>${company.country}</td>
        <td>${compact(company.employees)}</td>
        <td>${usd(company.market_cap_usd)}</td>
        <td>${usd(company.revenue_usd)}</td>
      </tr>
    `,
    )
    .join("");

  const totalPages = Math.ceil(payload.total / payload.page_size) || 1;
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = `
    <button ${payload.page <= 1 ? "disabled" : ""} id="prev-btn">◀ Prev</button>
    <span>Page ${payload.page} / ${totalPages}</span>
    <button ${payload.page >= totalPages ? "disabled" : ""} id="next-btn">Next ▶</button>
  `;

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    loadCompanies();
  });
  document.getElementById("next-btn")?.addEventListener("click", () => {
    state.page = Math.min(totalPages, state.page + 1);
    loadCompanies();
  });
}

function renderCountryContext(rows) {
  const tbody = document.querySelector("#country-table tbody");
  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${row.country}</td>
        <td>${row.gdp_usd_trillion}</td>
        <td>${row.population_millions}</td>
        <td>${row.hdi}</td>
      </tr>
    `,
    )
    .join("");
}

function renderSources(sources) {
  const el = document.getElementById("sources-list");
  const buckets = ["trade_flows"];
  el.innerHTML = buckets
    .flatMap((bucket) => sources[bucket].map((source) => `<li><a href="${source.url}" target="_blank">${source.name}</a><span>${source.license}</span></li>`))
    .join("");
}

async function loadSuggestions() {
  const q = document.getElementById("q").value.trim();
  const box = document.getElementById("suggestions");
  if (!q) {
    box.innerHTML = "";
    return;
  }

  const items = await fetchJson(`/api/v1/companies/search/suggestions?q=${encodeURIComponent(q)}`);
  box.innerHTML = items.map((item) => `<button class="suggestion-item" data-symbol="${item.symbol}">${item.symbol} — ${item.company}</button>`).join("");

  box.querySelectorAll(".suggestion-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("q").value = button.dataset.symbol;
      box.innerHTML = "";
      state.page = 1;
      loadCompanies();
    });
  });
}

async function loadFilterOptions() {
  const [sectorAgg, countryAgg] = await Promise.all([
    fetchJson("/api/v1/companies/analytics/by-sector"),
    fetchJson("/api/v1/companies/analytics/by-country"),
  ]);

  const sectors = sectorAgg.map((row) => row.sector).sort();
  const countries = countryAgg.map((row) => row.country).sort();

  const sectorSelect = document.getElementById("sector");
  const countrySelect = document.getElementById("country");

  sectorSelect.innerHTML = `<option value="">All</option>${sectors.map((s) => `<option>${s}</option>`).join("")}`;
  countrySelect.innerHTML = `<option value="">All</option>${countries.map((c) => `<option>${c}</option>`).join("")}`;
}

async function loadCompanies() {
  const query = buildQuery();
  const payload = await fetchJson(`/api/v1/companies?${query}`);
  renderCompanies(payload);
}

async function boot() {
  const [overview, sectors, countryContext, sources] = await Promise.all([
    fetchJson("/api/v1/companies/analytics/overview"),
    fetchJson("/api/v1/companies/analytics/by-sector"),
    fetchJson("/api/v1/companies/country-context"),
    fetchJson("/api/v1/trade-flows/sources"),
    loadFilterOptions(),
  ]);

  renderKpis(overview);
  renderSectorChart(sectors);
  renderCountryContext(countryContext);
  renderSources({ trade_flows: sources });
  await loadCompanies();

  document.getElementById("apply-btn").addEventListener("click", () => {
    state.page = 1;
    loadCompanies();
  });

  document.getElementById("q").addEventListener("input", () => {
    loadSuggestions().catch(console.error);
  });
}

boot().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="color:#fff">Failed to load Atlas dashboard: ${error.message}</pre>`;
});
