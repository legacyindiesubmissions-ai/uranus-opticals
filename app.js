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
    updatePriceTags();
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

function updatePriceTags() {
  const accessories = [
    {id: 'flattener', priceId: 'price_flattener', chk: 'chk_flattener'},
    {id: 'spacers', priceId: 'price_spacers', chk: 'chk_spacers'},
    {id: 'guidescope', priceId: 'price_guidescope', chk: 'chk_guidescope'},
    {id: 'guidecam', priceId: 'price_guidecam', chk: 'chk_guidecam'},
    {id: 'filter', priceId: 'price_filter', chk: 'chk_filter'},
    {id: 'dewheater', priceId: 'price_dewheater', chk: 'chk_dewheater'},
    {id: 'bag', priceId: 'price_bag', chk: 'chk_bag'},
    {id: 'bag_lg', priceId: 'price_bag_lg', chk: 'chk_bag_lg'},
    {id: 'case', priceId: 'price_case', chk: 'chk_case'},
    {id: 'case_xl', priceId: 'price_case_xl', chk: 'chk_case_xl'},
    {id: 'power', priceId: 'price_power', chk: 'chk_power'},
    {id: 'tripod', priceId: 'price_tripod', chk: 'chk_tripod'}
  ];
  
  accessories.forEach(acc => {
    const chk = byId(acc.chk);
    const pTag = byId(acc.priceId);
    if (chk && pTag && dbPrices[chk.value]) {
      pTag.textContent = `$${dbPrices[chk.value].toFixed(2)}`;
    }
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

  // 1. Dynamic Accessory Logic
  const accList = ['flattener', 'spacers', 'guidescope', 'guidecam', 'filter', 'dewheater', 'bag', 'bag_lg', 'case', 'case_xl', 'power', 'tripod'];

  accList.forEach(id => {
    const chk = byId(`chk_${id}`);
    const lbl = byId(`lbl_${id}`);
    const desc = byId(`desc_${id}`);
    if (!chk || !lbl || !desc) return;

    let show = true;
    let forceCheck = false;
    let note = '';

    const effectiveLen = (scopeId === 'none') ? cLen : scope.len;

    // Flattener Rules
    if (id === 'flattener') {
      if (scopeId === 'glancer') { show = true; forceCheck = true; note = '(Required for Doublet)'; }
      else if (scopeId === 'none') { 
        if (scope.type === 'Petzval') show = false;
        else if (cFR >= 6 || scope.type === 'Doublet') { show = true; note = '(Highly Recommended)'; }
        else { show = true; note = '(Optional for Refractors)'; }
      }
      else { show = false; }
    }
    // Bag/Case Rules
    else if (id === 'bag') {
      if (effectiveLen > 0 && effectiveLen <= 380) { show = true; note = '(Perfect Fit)'; }
      else { show = false; }
    }
    else if (id === 'bag_lg') {
      if (effectiveLen > 380 && effectiveLen <= 620) { show = true; note = '(Confirmed Fit)'; }
      else { show = false; }
    }
    else if (id === 'case') {
      if (effectiveLen > 0 && effectiveLen <= 520) { show = true; note = '(Hard Shell Protection)'; }
      else { show = false; }
    }
    else if (id === 'case_xl') {
      if (effectiveLen > 520 || scopeId === 'glancer' || scopeId === 'panoramic') { show = true; note = '(Maximum Protection)'; }
      else { show = false; }
    }
    // Spacer Rules
    else if (id === 'spacers') {
      if (scopeId !== 'none' && cameraId !== 'none') { show = true; forceCheck = true; note = '(Required for Backfocus)'; }
      else { show = true; note = '(Optional)'; }
    }

    if (!show) {
      lbl.style.display = 'none';
      chk.checked = false;
    } else {
      lbl.style.display = 'flex';
      chk.disabled = forceCheck;
      if (forceCheck) chk.checked = true;
      
      const baseText = desc.innerHTML.split('<br>')[0].trim();
      desc.innerHTML = note ? `${baseText} <br><small style="color: ${forceCheck ? 'var(--accent)' : 'var(--muted)}; font-weight: ${forceCheck?600:400};">${note}</small>` : baseText;
    }
  });

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

  document.querySelectorAll('.addon-chk:checked').forEach(chk => {
    if (dbPrices[chk.value]) total += dbPrices[chk.value];
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
  document.querySelectorAll('.addon-chk:checked').forEach(chk => items.push(chk.value));

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
  byId("builderControls").addEventListener("change", updateConfigurator);
  byId("customScopeLen").addEventListener("input", updateConfigurator);
  byId("customScopeFR").addEventListener("input", updateConfigurator);
}
