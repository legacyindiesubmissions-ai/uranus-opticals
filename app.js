/* ═══════════════════════════════════════════
   URANUS OPTICALS — Mission Ready-Sourced Deep Scope Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

let dbPrices = {};
let globalScopes = [];
let selectedGlobalScope = null;
let analysisUnlocked = false;

const scopes = {
  none:       { name: "Custom Profile Active",                      backfocus: 0,  thread: "N/A", weight: 0,   len: 0,   reqFlattener: false },
  glancer:    { name: "Svbony SV503 80ED (Beginner Probe)",         backfocus: 55, thread: "M48", weight: 3.9, len: 470, reqFlattener: true },
  penetrator: { name: "Askar FRA300 Pro (The Deep Explorer)",       backfocus: 55, thread: "M48", weight: 3.1, len: 303, reqFlattener: false },
  panoramic:  { name: "Uranus Signature 80 APO (Full Insertion)",   backfocus: 55, thread: "M54", weight: 5.2, len: 410, reqFlattener: false }
};

const cameras = {
  none:          { name: "None / Have my own",                         depth: 0,    thread: "N/A", weight: 0 },
  snapshot533:   { name: "Svbony SV605CC (Cooled Deep Sensor)",        depth: 17.5, thread: "M42", weight: 0.42 },
  deepgaze571:   { name: "Player One Poseidon-C (Direct Core)",        depth: 17.5, thread: "M42", weight: 0.68 },
  omnivision455: { name: "Uranus Signature 533C (High Penetration)", depth: 17.5, thread: "M42", weight: 0.72 }
};

const mounts = {
  none:       { name: "None / Have my own",                capacity: 999 },
  steadygaze: { name: "Sky-Watcher GTi (Light duty)",      capacity: 5  },
  am3:        { name: "ZWO AM3N (Medium load)",            capacity: 8  },
  hm17:       { name: "Uranus Harmonic 17 (Heavy handler)", capacity: 15 }
};

const accessoriesWeight = 1.2;

function byId(id) {
  return document.getElementById(id);
}

// ── Database & Price Loading ──
async function initData() {
  try {
    const [priceRes, scopeRes] = await Promise.all([
      fetch("/api/uranus/prices"),
      fetch("global_scopes.json")
    ]);
    
    if (priceRes.ok) dbPrices = await priceRes.json();
    if (scopeRes.ok) globalScopes = await scopeRes.json();
    
    initSearch();
  } catch (e) {
    console.error("Failed to load mission data", e);
  } finally {
    renderAccessories();
    updateConfigurator();
  }
}

function initSearch() {
  const searchInput = byId("scopeSearch");
  const suggestions = byId("searchSuggestions");
  
  if (!searchInput || !suggestions) return;

  searchInput.addEventListener("input", () => {
    const val = searchInput.value.toLowerCase();
    suggestions.innerHTML = "";
    if (val.length < 2) {
      suggestions.style.display = "none";
      return;
    }

    const matches = globalScopes.filter(s => 
      s.brand.toLowerCase().includes(val) || s.model.toLowerCase().includes(val)
    ).slice(0, 5);

    if (matches.length > 0) {
      matches.forEach(m => {
        const div = document.createElement("div");
        div.style.padding = "10px";
        div.style.cursor = "pointer";
        div.style.borderBottom = "1px solid var(--border)";
        div.innerHTML = `<div style="font-weight:bold; font-size:0.85rem;">${m.brand} ${m.model}</div><div style="font-size:0.7rem; color:var(--muted);">${m.type} | ${m.len}mm</div>`;
        div.addEventListener("click", () => selectGlobalScope(m));
        suggestions.appendChild(div);
      });
      suggestions.style.display = "block";
    } else {
      suggestions.style.display = "none";
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target !== searchInput) suggestions.style.display = "none";
  });
}

function selectGlobalScope(scope) {
  selectedGlobalScope = scope;
  byId("scopeSearch").value = `${scope.brand} ${scope.model}`;
  byId("customScopeLen").value = scope.len;
  byId("customScopeFR").value = 0; // Not strictly needed if we have the profile
  byId("selectedScopeLabel").textContent = `${scope.brand} ${scope.model} Profile Loaded`;
  byId("searchSuggestions").style.display = "none";
  analysisUnlocked = false; // Reset lock on change
  updateConfigurator();
}

// ── Accessory Definitions ──
const accessoryDefs = [
  {id: 'flattener',  name: 'Field Flattener',               desc: 'Corrects field curvature. Required for doublet refractors.',               priceKey: 'acc_flattener',   forceId: 'glancer' },
  {id: 'spacers',    name: 'M42/M48 Spacer Kit',             desc: 'Dial in exact 55mm backfocus. Included free with every scope+camera pair.', priceKey: 'acc_spacers',    forceId: null },
  {id: 'guidescope', name: '30mm Guide Scope',               desc: 'High-precision tracking for sub-arcsecond guiding.',                         priceKey: 'acc_guidescope',  forceId: null },
  {id: 'guidecam',   name: 'Ceres-M Guide Camera',           desc: 'Mono sensor for rock-solid autoguiding lock.',                                priceKey: 'acc_guidecam',    forceId: null },
  {id: 'filter',     name: 'Dual-Band Light Pollution Filter', desc: 'Cuts city glow. Saturates nebulae. 2" mounted.',                           priceKey: 'acc_filter',      forceId: null },
  {id: 'dewheater',  name: 'USB Dew Heater Strip',           desc: 'Prevents lens fog during long winter sessions.',                             priceKey: 'acc_dewheater',   forceId: null },
  {id: 'bag',        name: 'Padded Telescope Bag (Small)',   desc: 'Fits scopes up to 380mm retracted. Padded shell.',                           priceKey: 'acc_bag_scope',   forceId: null, maxLen: 380 },
  {id: 'bag_lg',     name: 'XL Padded Telescope Bag (65cm)', desc: 'Heavy padding for large refractors up to 620mm.',                            priceKey: 'acc_bag_lg',      forceId: null, minLen: 381, maxLen: 620 },
  {id: 'case',       name: 'Hard Case w/ Pluck Foam (Small)', desc: 'Waterproof protection for scopes up to 520mm.',                             priceKey: 'acc_case_hard',   forceId: null, maxLen: 520 },
  {id: 'case_xl',    name: 'XL Waterproof Hard Case (60cm)', desc: 'Deep rugged case. Fits the big glass.',                                      priceKey: 'acc_case_xl',     forceId: null, minLen: 521 },
  {id: 'power',      name: '12V Portable Power Bank',        desc: '60Wh capacity. Runs mount + camera for 4-6 hours.',                          priceKey: 'acc_power',       forceId: null },
  {id: 'tripod',     name: 'Carbon Fiber Tripod',            desc: 'Lightweight, vibration-dampening. 8kg payload.',                              priceKey: 'acc_tripod',      forceId: null },
];

function getAccessoryState() {
  const state = {};
  accessoryDefs.forEach(a => {
    const sel = byId(`accsel_${a.id}`);
    state[a.id] = sel ? sel.value === 'yes' : false;
  });
  return state;
}

function renderAccessories() {
  const container = byId('accessoryPicker');
  if (!container) return;

  const scopeId = byId('scopeSelect').value;
  const cameraId = byId('cameraSelect').value;
  const cLen = parseFloat(byId('customScopeLen').value) || 0;
  const effectiveLen = (scopeId === 'none') ? cLen : (scopes[scopeId] ? scopes[scopeId].len : 0);

  let html = `
    <div class="picker-header-row">
      <div class="col-part">Field Gear</div>
      <div class="col-selection">Status &amp; Recommendation</div>
      <div class="col-price">Price</div>
    </div>`;

  accessoryDefs.forEach(a => {
    // Visibility rules
    let visible = true;
    let forceOn = false;
    let note = '';

    if (a.forceId && scopeId === a.forceId) { forceOn = true; note = 'Required for this scope'; }
    if (a.maxLen && effectiveLen > a.maxLen) visible = false;
    if (a.minLen && effectiveLen < a.minLen) visible = false;

    // Auto-force spacers when both scope and camera selected
    if (a.id === 'spacers' && scopeId !== 'none' && cameraId !== 'none') { forceOn = true; note = 'Required for backfocus'; }

    // Special: bag/case sizing
    if (a.id === 'bag' && effectiveLen > 0 && effectiveLen <= 380) note = 'Perfect fit';
    if (a.id === 'bag_lg' && effectiveLen > 380 && effectiveLen <= 620) note = 'Confirmed fit';
    if (a.id === 'case' && effectiveLen > 0 && effectiveLen <= 520) note = 'Hard shell protection';
    if (!visible && (a.id === 'bag' || a.id === 'bag_lg' || a.id === 'case' || a.id === 'case_xl')) note = 'Wrong size for this scope';

    const price = dbPrices[a.priceKey] ? `$${dbPrices[a.priceKey].toFixed(2)}` : '...';
    const included = forceOn || (visible && false); // default all off unless forced

    html += `
      <div class="picker-row excluded" id="row_${a.id}" style="${visible ? '' : 'display:none;'}">
        <div class="col-part">
          <h4>${a.name}</h4>
        </div>
        <div class="col-selection">
          <select class="tier-select acc-select" id="accsel_${a.id}" data-id="${a.id}" ${forceOn ? 'disabled' : ''}>
            <option value="no" ${forceOn ? '' : 'selected'}>Exclude</option>
            <option value="yes" ${forceOn ? 'selected' : ''}>Include in Rig</option>
          </select>
          <div class="specs-box">
            <p class="specs-desc">${a.desc}</p>
            <span class="stock-badge">${note || 'Uranus Global Precision'}</span>
          </div>
        </div>
        <div class="col-price">
          <span class="price-val">${price}</span>
        </div>
      </div>`;
  });

  container.innerHTML = html;

  // Bind dropdown change events
  container.querySelectorAll('.acc-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const row = byId(`row_${e.target.dataset.id}`);
      if (row) {
        if (e.target.value === 'yes') row.classList.replace('excluded', 'included');
        else row.classList.replace('included', 'excluded');
      }
      updateConfigurator();
    });
  });
}

// ── Core Engine ──
async function updateConfigurator() {
  const scopeId = byId("scopeSelect").value;
  const cameraId = byId("cameraSelect").value;
  const mountId = byId("mountSelect").value;
  
  const customScopeDiv = byId("customScopeForm");
  const cLen = parseFloat(byId("customScopeLen").value) || 0;
  const cFR = parseFloat(byId("customScopeFR").value) || 0;

  if (scopeId === 'none') {
    customScopeDiv.style.display = 'block';
  } else {
    customScopeDiv.style.display = 'none';
  }

  const scope  = selectedGlobalScope && scopeId === 'none' ? { ...selectedGlobalScope, name: selectedGlobalScope.model } : scopes[scopeId];
  const camera = cameras[cameraId];
  const mount  = mounts[mountId];

  if (!scope || !camera || !mount) return;

  // 1. Re-render accessories with current scope visibility rules
  renderAccessories();

  // 2. Compatibility Math
  let payload = scope.weight + camera.weight;
  if (scopeId !== 'none' || cameraId !== 'none') payload += accessoriesWeight;

  let compatible = true;
  let payloadMsg = "N/A (Loose Parts)";
  
  if (mountId !== 'none') {
    const limit = mount.capacity * 0.5;
    if (payload > limit) {
      compatible = false;
      payloadMsg = `Overloaded (${payload.toFixed(1)}kg / ${limit.toFixed(1)}kg limit)`;
    } else {
      payloadMsg = `Within range (${payload.toFixed(1)}kg / ${limit.toFixed(1)}kg limit)`;
    }
  }

  // 3. UI Updates (The Paywall Logic)
  byId("scopeName").textContent = scope.name;
  byId("cameraName").textContent = camera.name;
  
  const checkoutBtn = byId("btnCheckoutRig");

  if (scopeId === 'none' && !analysisUnlocked) {
    byId("adapterResult").innerHTML = '<span style="filter: blur(4px); opacity: 0.5;">Mxx to Mxx Adapter</span>';
    byId("spacerResult").innerHTML = '<span style="filter: blur(4px); opacity: 0.5;">xx.x mm Required</span>';
    checkoutBtn.textContent = "RUN MISSION SIMULATION";
    checkoutBtn.onclick = startSimulation;
  } else {
    const spacerVal = scope.backfocus - camera.depth;
    const adapterVal = scope.thread === camera.thread ? `Direct ${scope.thread}` : `${scope.thread} to ${camera.thread} adapter`;
    
    byId("adapterResult").textContent = (scopeId !== 'none' || analysisUnlocked) ? adapterVal : "N/A";
    byId("spacerResult").textContent = (scopeId !== 'none' || analysisUnlocked) ? `${spacerVal.toFixed(1)}mm Required` : "N/A";
    
    checkoutBtn.textContent = compatible ? "SECURE YOUR RIG" : "RIG INVALID";
    checkoutBtn.onclick = checkoutRig;
  }

  byId("payloadResult").textContent = payloadMsg;
  byId("cartResult").textContent = compatible ? "Ready" : "Blocked";

  const status = byId("resultStatus");
  status.textContent = compatible ? "Cleared for Contact" : "Mount Blocked";
  status.className = `result-status ${compatible ? "ok" : "bad"}`;
  
  byId("resultNote").textContent = compatible ? "Verification engine active." : "This rig did not pass the private compatibility checks.";

  // 4. Price Calculation
  let total = 0;
  if (dbPrices[scopeId]) total += dbPrices[scopeId];
  if (dbPrices[cameraId]) total += dbPrices[cameraId];
  if (dbPrices[mountId]) total += dbPrices[mountId];

  const accState = getAccessoryState();
  accessoryDefs.forEach(a => {
    if (accState[a.id] && dbPrices[a.priceKey]) total += dbPrices[a.priceKey];
  });

  const rigTotal = byId("rigTotal");
  if (rigTotal) rigTotal.textContent = `$${total.toFixed(2)}`;
}

// ── The Simulation & Humor Engine ──
const jokes = [
  "Uranus is 4x wider than Earth... that's a lot of aperture.",
  "Probing the absolute depths of Uranus...",
  "Scanning for obstructions in Uranus...",
  "Adjusting focus for a closer look at Uranus...",
  "Ensuring the payload slides easily into Uranus...",
  "Uranus has 27 moons. We're checking fitment for all of them.",
  "Atmospheric gasses detected. Uranus is a bit windy today.",
  "Calibration complete. Uranus is looking quite round."
];

function startSimulation() {
  const overlay = byId("simulationOverlay");
  const progress = byId("simProgress");
  const ticker = byId("logTicker");
  const header = byId("logHeader");
  const scanner = byId("scannerBeam");

  overlay.style.display = "flex";
  scanner.style.opacity = "1";
  scanner.style.animation = "scan 2s infinite";

  let p = 0;
  let jokeIdx = 0;
  
  const interval = setInterval(() => {
    p += 0.5;
    progress.style.width = p + "%";
    
    if (Math.floor(p) % 15 === 0) {
      ticker.innerHTML = `<div style="animation: fadeIn 0.5s;">${jokes[jokeIdx % jokes.length]}</div>` + ticker.innerHTML;
      jokeIdx++;
    }

    if (p >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
          overlay.style.opacity = "1";
          byId("paywallModal").style.display = "flex";
        }, 500);
      }, 1000);
    }
  }, 100);
}

byId("btnUnlockAnalysis").onclick = () => {
  byId("btnUnlockAnalysis").textContent = "VERIFYING PAYMENT...";
  setTimeout(() => {
    analysisUnlocked = true;
    byId("paywallModal").style.display = "none";
    updateConfigurator();
    alert("Consultation Unlocked. Millimetric Recipe now visible.");
  }, 2000);
};

async function checkoutRig() {
  const checkoutBtn = byId("btnCheckoutRig");
  checkoutBtn.textContent = 'CONNECTING...';
  const items = [];
  if (byId("scopeSelect").value !== 'none') items.push(byId("scopeSelect").value);
  if (byId("cameraSelect").value !== 'none') items.push(byId("cameraSelect").value);
  if (byId("mountSelect").value !== 'none') items.push(byId("mountSelect").value);
  const accState = getAccessoryState();
  accessoryDefs.forEach(a => {
    if (accState[a.id]) items.push(a.priceKey);
  });

  try {
    const res = await fetch(`/api/uranus/checkout_hardware?items=${items.join(',')}`);
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch (error) {
    alert("Checkout failed. Mission Control is looking into it.");
  }
}

document.addEventListener("DOMContentLoaded", initData);
if (byId("builderControls")) {
  byId("builderControls").addEventListener("change", (e) => {
    if (e.target.id === 'scopeSelect') renderAccessories();
    updateConfigurator();
  });
  byId("customScopeLen").addEventListener("input", () => { renderAccessories(); updateConfigurator(); });
  byId("customScopeFR").addEventListener("input", updateConfigurator);
}
