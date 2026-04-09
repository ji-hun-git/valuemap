const state = {
  companies: [],
  filtered: [],
  markers: [],
  map: null,
};

function usd(value, digits = 0) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(value);
}

function pct(value) {
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function markerHtml(company) {
  const change = company.change_percent ?? 0;
  const color = change >= 0 ? "#42f5b9" : "#ff6f91";
  return `
    <div style="width:16px;height:16px;border-radius:999px;background:${color};border:2px solid rgba(255,255,255,.75);box-shadow:0 0 12px ${color};"></div>
  `;
}

function initMap() {
  if (state.map) return;

  state.map = L.map("map", {
    worldCopyJump: true,
    zoomControl: true,
  }).setView([26, 8], 2);

  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
    maxZoom: 8,
  }).addTo(state.map);
}

function clearMarkers() {
  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
}

function renderMarkers(rows) {
  clearMarkers();

  rows.forEach((company) => {
    const icon = L.divIcon({
      className: "company-dot",
      html: markerHtml(company),
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker([company.lat, company.lon], { icon }).addTo(state.map);
    marker.bindPopup(`
      <div>
        <div class="popup-title">${company.symbol} · ${company.name}</div>
        <div>${company.city}, ${company.country}</div>
        <div>Price: ${usd(company.price, 2)}</div>
        <div class="${(company.change_percent ?? 0) >= 0 ? "up" : "down"}">24h: ${pct(company.change_percent ?? 0)}</div>
        <div>Market Cap: ${usd(company.market_cap)}</div>
      </div>
    `);

    state.markers.push(marker);
  });
}

function renderPulse(companies, bitcoin, asOfEpoch) {
  const cards = document.getElementById("pulse-cards");
  const totalCap = companies.reduce((sum, row) => sum + (row.market_cap || 0), 0);
  const avgMove = companies.reduce((sum, row) => sum + (row.change_percent || 0), 0) / (companies.length || 1);
  const lastUpdate = new Date(asOfEpoch * 1000).toLocaleTimeString();

  cards.innerHTML = `
    <article class="card">
      <div class="label">Tracked Companies</div>
      <div class="value">${companies.length}</div>
    </article>
    <article class="card">
      <div class="label">Total Market Cap</div>
      <div class="value">${usd(totalCap)}</div>
    </article>
    <article class="card">
      <div class="label">Avg Stock Change</div>
      <div class="value ${avgMove >= 0 ? "up" : "down"}">${pct(avgMove)}</div>
    </article>
    <article class="card">
      <div class="label">Bitcoin</div>
      <div class="value">${usd(bitcoin.price, 2)}</div>
      <div class="${(bitcoin.change_percent_24h ?? 0) >= 0 ? "up" : "down"}">${pct(bitcoin.change_percent_24h)}</div>
    </article>
    <article class="card">
      <div class="label">Last Refresh</div>
      <div class="value">${lastUpdate}</div>
    </article>
  `;
}

function renderMovers(rows) {
  const movers = document.getElementById("movers");
  const sorted = [...rows]
    .filter((row) => row.change_percent !== null && row.change_percent !== undefined)
    .sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent))
    .slice(0, 10);

  movers.innerHTML = sorted
    .map(
      (row) => `
      <div class="mover">
        <strong>${row.symbol}</strong>
        <span>${usd(row.price, 2)}</span>
        <span class="${row.change_percent >= 0 ? "up" : "down"}">${pct(row.change_percent)}</span>
      </div>
    `,
    )
    .join("");
}

function populateCountries(rows) {
  const select = document.getElementById("region-filter");
  const countries = [...new Set(rows.map((row) => row.country))].sort();
  select.innerHTML = `<option value="">All countries</option>${countries.map((country) => `<option value="${country}">${country}</option>`).join("")}`;
}

function applyFilters() {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const country = document.getElementById("region-filter").value;

  state.filtered = state.companies.filter((row) => {
    const searchMatch =
      !search ||
      row.symbol.toLowerCase().includes(search) ||
      row.name.toLowerCase().includes(search);
    const countryMatch = !country || row.country === country;
    return searchMatch && countryMatch;
  });

  renderMarkers(state.filtered);
  renderMovers(state.filtered);
}

async function refreshLiveData() {
  const [companiesData, bitcoinData] = await Promise.all([
    fetchJson("/api/v1/live/companies"),
    fetchJson("/api/v1/live/bitcoin"),
  ]);

  state.companies = companiesData.items;
  state.filtered = companiesData.items;
  populateCountries(state.companies);

  renderPulse(companiesData.items, bitcoinData.item, companiesData.as_of_epoch);
  applyFilters();
}

async function boot() {
  initMap();
  await refreshLiveData();

  document.getElementById("search").addEventListener("input", applyFilters);
  document.getElementById("region-filter").addEventListener("change", applyFilters);
  document.getElementById("refresh-btn").addEventListener("click", () => {
    refreshLiveData().catch(console.error);
  });

  setInterval(() => {
    refreshLiveData().catch(console.error);
  }, 30000);
}

boot().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="color:#fff">Failed to load satellite map: ${error.message}</pre>`;
});
