const state = {
  page: 1,
  pageSize: 20,
  viewer: null,
  companyEntities: [],
  flightEntities: [],
  flowEntities: [],
  liveCompanies: [],
};

function usd(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
function compact(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function addChat(role, text) {
  const log = document.getElementById("chat-log");
  const row = document.createElement("div");
  row.className = `chat-row ${role}`;
  row.textContent = text;
  log.prepend(row);
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

function initGlobe() {
  const viewer = new Cesium.Viewer("globe", {
    timeline: false,
    animation: false,
    geocoder: false,
    sceneModePicker: false,
    baseLayerPicker: true,
    navigationHelpButton: false,
    infoBox: true,
  });
  viewer.scene.globe.enableLighting = true;

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click) => {
    const picked = viewer.scene.pick(click.position);
    if (!picked || !picked.id || !picked.id.properties) return;
    const props = picked.id.properties;
    const symbol = props.symbol?.getValue?.();
    if (symbol) {
      document.getElementById("q").value = symbol;
      state.page = 1;
      loadCompanies().catch(console.error);
      addChat("assistant", `Focused on ${symbol}.`);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  state.viewer = viewer;
}

function clearEntities(bucketName) {
  state[bucketName].forEach((entity) => state.viewer.entities.remove(entity));
  state[bucketName] = [];
}

function syncCompaniesToGlobe(companies) {
  if (!state.viewer) return;
  clearEntities("companyEntities");
  state.liveCompanies = companies;

  companies.forEach((company) => {
    const height = company.market_cap ? Math.max(25_000, Math.min(900_000, company.market_cap / 12_000_000)) : 50_000;
    const entity = state.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(company.lon, company.lat, height / 2),
      cylinder: { length: height, topRadius: 14_000, bottomRadius: 14_000, material: Cesium.Color.CYAN.withAlpha(0.65) },
      label: {
        text: `${company.symbol} ${company.price ? `$${company.price.toFixed(2)}` : ""}`,
        font: "12px sans-serif",
        fillColor: Cesium.Color.WHITE,
        pixelOffset: new Cesium.Cartesian2(0, -22),
      },
      properties: { symbol: company.symbol },
      description: `<b>${company.name}</b><br/>${company.city}, ${company.country}<br/>Price: ${company.price ?? "N/A"}`,
    });
    state.companyEntities.push(entity);
  });
}

function syncFlightsToGlobe(flights) {
  if (!state.viewer) return;
  clearEntities("flightEntities");

  flights.forEach((flight) => {
    const entity = state.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(flight.longitude, flight.latitude, (flight.baro_altitude || 10000)),
      point: { pixelSize: 4, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 1 },
      label: { text: flight.callsign || flight.icao24, font: "10px sans-serif", pixelOffset: new Cesium.Cartesian2(0, 10) },
    });
    state.flightEntities.push(entity);
  });
}

function syncFlowsToGlobe(flows) {
  if (!state.viewer) return;
  clearEntities("flowEntities");

  flows.forEach((flow) => {
    if (!flow.source || !flow.target) return;
    const width = Math.max(1.2, Math.min(6, flow.value_usd / 40_000_000_000));
    const positions = Cesium.Cartesian3.fromDegreesArrayHeights([
      flow.source.lon,
      flow.source.lat,
      200000,
      (flow.source.lon + flow.target.lon) / 2,
      (flow.source.lat + flow.target.lat) / 2,
      1200000,
      flow.target.lon,
      flow.target.lat,
      200000,
    ]);

    const entity = state.viewer.entities.add({
      polyline: {
        positions,
        width,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.22,
          color: Cesium.Color.MAGENTA.withAlpha(0.75),
        }),
      },
      description: `${flow.commodity}<br/>${flow.source_country} → ${flow.target_country}<br/>${usd(flow.value_usd)}`,
    });
    state.flowEntities.push(entity);
  });
}

function renderKpis(overview) {
  document.getElementById("kpis").innerHTML = [
    ["Companies", compact(overview.companies)],
    ["Total Market Cap", usd(overview.total_market_cap_usd)],
    ["Total Revenue", usd(overview.total_revenue_usd)],
    ["Total Employees", compact(overview.total_employees)],
  ].map(([l, v]) => `<article class="kpi-card glass"><p>${l}</p><h3>${v}</h3></article>`).join("");
}

function renderCompanies(payload) {
  const tbody = document.querySelector("#companies-table tbody");
  tbody.innerHTML = payload.items.map((c) => `<tr><td>${c.symbol}</td><td>${c.company}</td><td>${c.sector}</td><td>${c.country}</td><td>${compact(c.employees)}</td><td>${usd(c.market_cap_usd)}</td><td>${usd(c.revenue_usd)}</td></tr>`).join("");
  const totalPages = Math.ceil(payload.total / payload.page_size) || 1;
  document.getElementById("pagination").innerHTML = `<button ${payload.page <= 1 ? "disabled" : ""} id="prev-btn">◀ Prev</button><span>Page ${payload.page}/${totalPages}</span><button ${payload.page >= totalPages ? "disabled" : ""} id="next-btn">Next ▶</button>`;
  document.getElementById("prev-btn")?.addEventListener("click", () => { state.page = Math.max(1, state.page - 1); loadCompanies(); });
  document.getElementById("next-btn")?.addEventListener("click", () => { state.page = Math.min(totalPages, state.page + 1); loadCompanies(); });
}

function renderCountryContext(rows) {
  document.querySelector("#country-table tbody").innerHTML = rows.map((r) => `<tr><td>${r.country}</td><td>${r.gdp_usd_trillion}</td><td>${r.population_millions}</td><td>${r.hdi}</td></tr>`).join("");
}

async function loadSuggestions() {
  const q = document.getElementById("q").value.trim();
  const box = document.getElementById("suggestions");
  if (!q) return (box.innerHTML = "");
  const items = await fetchJson(`/api/v1/companies/search/suggestions?q=${encodeURIComponent(q)}`);
  box.innerHTML = items.map((item) => `<button class="suggestion-item" data-symbol="${item.symbol}">${item.symbol} — ${item.company}</button>`).join("");
  box.querySelectorAll(".suggestion-item").forEach((button) => button.addEventListener("click", () => {
    document.getElementById("q").value = button.dataset.symbol;
    box.innerHTML = "";
    state.page = 1;
    loadCompanies();
  }));
}

async function loadFilterOptions() {
  const [sectorAgg, countryAgg] = await Promise.all([
    fetchJson("/api/v1/companies/analytics/by-sector"),
    fetchJson("/api/v1/companies/analytics/by-country"),
  ]);
  document.getElementById("sector").innerHTML = `<option value="">All</option>${sectorAgg.map((r) => `<option>${r.sector}</option>`).join("")}`;
  document.getElementById("country").innerHTML = `<option value="">All</option>${countryAgg.map((r) => `<option>${r.country}</option>`).join("")}`;
}

async function loadCompanies() {
  const payload = await fetchJson(`/api/v1/companies?${buildQuery()}`);
  renderCompanies(payload);
}

async function askCopilot() {
  const input = document.getElementById("chat-input");
  const prompt = input.value.trim();
  if (!prompt) return;
  addChat("user", prompt);
  input.value = "";

  const result = await fetchJson("/api/v1/ai/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  addChat("assistant", result.answer);

  const action = result.actions?.[0];
  if (action?.type === "focus_company") {
    const company = state.liveCompanies.find((c) => c.symbol === action.symbol);
    if (company && state.viewer) {
      state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(company.lon, company.lat, 3_500_000) });
    }
  }
}

async function refreshLiveMap() {
  const [companies, flights, flows] = await Promise.all([
    fetchJson("/api/v1/live/companies"),
    fetchJson("/api/v1/live/aircraft?limit=80"),
    fetchJson("/api/v1/trade-flows/map/arcs?limit=45"),
  ]);

  syncCompaniesToGlobe(companies.items);
  syncFlightsToGlobe(flights.items);
  syncFlowsToGlobe(flows);

  document.getElementById("live-stamp").textContent = `Live updated: ${new Date(companies.as_of_epoch * 1000).toLocaleTimeString()}`;

  const flowMeta = await fetchJson("/api/v1/live/value-flows?limit=35");
  document.getElementById("aoe-badge").textContent = `AOE Index: ${flowMeta.aoe_index}`;
}

async function boot() {
  initGlobe();

  const [overview, countryContext] = await Promise.all([
    fetchJson("/api/v1/companies/analytics/overview"),
    fetchJson("/api/v1/companies/country-context"),
    loadFilterOptions(),
    loadCompanies(),
  ]);

  renderKpis(overview);
  renderCountryContext(countryContext);
  await refreshLiveMap();
  setInterval(() => refreshLiveMap().catch(console.error), 15000);

  document.getElementById("apply-btn").addEventListener("click", () => { state.page = 1; loadCompanies(); });
  document.getElementById("q").addEventListener("input", () => loadSuggestions().catch(console.error));
  document.getElementById("chat-send").addEventListener("click", () => askCopilot().catch(console.error));
  document.getElementById("chat-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") askCopilot().catch(console.error);
  });

  addChat("assistant", "Copilot ready. Try: 'largest company', 'top trade flow', or 'top country'.");
}

boot().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="color:#fff">Failed to load Atlas dashboard: ${error.message}</pre>`;
});
