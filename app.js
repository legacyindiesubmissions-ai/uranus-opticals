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
    updateAllPrices();
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

function updateAllPrices() {
  // Update price tags on configurator and loose debris pages
  const priceMap = {
    'price_flattener': dbPrices.acc_flattener,
    'price_spacers': dbPrices.acc_spacers,
    'price_guidescope': dbPrices.acc_guidescope,
    'price_guidecam': dbPrices.acc_guidecam,
    'price_filter': dbPrices.acc_filter,
    'price_dewheater': dbPrices.acc_dewheater,
    'price_bag_scope': dbPrices.acc_bag_scope,
    'price_bag_lg': dbPrices.acc_bag_lg,
    'price_case_hard': dbPrices.acc_case_hard,
    'price_case_xl': dbPrices.acc_case_xl,
    'price_power': dbPrices.acc_power,
    'price_tripod': dbPrices.acc_tripod,
  };
  Object.entries(priceMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = `$${val.toFixed(2)}`;
  });
}

// ── Accessory Definitions ──
const accessoryDefs = [
  {id: 'flattener',  name: 'Field Flattener',               desc: 'Corrects field curvature for sharp stars edge-to-edge.',                  priceKey: 'acc_flattener' },
  {id: 'spacers',    name: 'M42/M48 Spacer Kit',             desc: 'Precision spacers to dial in exact backfocus distance.',                   priceKey: 'acc_spacers' },
  {id: 'guidescope', name: '30mm Guide Scope',               desc: 'Compact guide scope for sub-arcsecond autoguiding.',                       priceKey: 'acc_guidescope' },
  {id: 'guidecam',   name: 'Ceres-M Guide Camera',           desc: 'High-sensitivity mono guide sensor. Rock-solid lock.',                     priceKey: 'acc_guidecam' },
  {id: 'filter',     name: 'Dual-Band Light Pollution Filter', desc: '2" mounted. Cuts city glow, saturates nebulae.',                        priceKey: 'acc_filter' },
  {id: 'dewheater',  name: 'USB Dew Heater Strip',           desc: 'Prevents lens fog on cold nights. Wraps any OTA.',                         priceKey: 'acc_dewheater' },
  {id: 'bag',        name: 'Padded Telescope Bag (Small)',   desc: 'Fits scopes up to 380mm retracted. Padded shell.',                         priceKey: 'acc_bag_scope' },
  {id: 'bag_lg',     name: 'XL Padded Telescope Bag (65cm)', desc: 'Heavy padding for refractors up to 620mm retracted.',                      priceKey: 'acc_bag_lg' },
  {id: 'case',       name: 'Hard Case w/ Pluck Foam (Small)', desc: 'Waterproof protection for scopes up to 520mm retracted.',                priceKey: 'acc_case_hard' },
  {id: 'case_xl',    name: 'XL Waterproof Hard Case (60cm)', desc: 'Deep rugged case for large OTAs and refractors.',                          priceKey: 'acc_case_xl' },
  {id: 'power',      name: '12V Portable Power Bank',        desc: '60Wh capacity. Runs mount + camera for 4-6 hours in the field.',           priceKey: 'acc_power' },
  {id: 'tripod',     name: 'Carbon Fiber Tripod',            desc: 'Lightweight, vibration-dampening. 8kg payload rating.',                    priceKey: 'acc_tripod' },
];

// Compute effective scope properties from whatever the user selected
function getEffectiveScope() {
  const scopeId = byId('scopeSelect').value;
  const cLen = parseFloat(byId('customScopeLen').value) || 0;
  const cFR  = parseFloat(byId('customScopeFR').value) || 0;

  if (scopeId !== 'none') {
    const s = scopes[scopeId];
    if (!s) return null;
    // Determine type from the preset
    let type = 'Refractor';
    if (scopeId === 'penetrator') type = 'Quintuplet';
    else if (scopeId === 'glancer') type = 'Doublet';
    else if (scopeId === 'panoramic') type = 'Triplet';
    return { len: s.len, weight: s.weight, thread: s.thread, backfocus: s.backfocus, type, reqFlattener: s.reqFlattener, name: s.name };
  }

  // Custom scope — check if global scope is loaded
  if (selectedGlobalScope) {
    return {
      len: selectedGlobalScope.len,
      weight: selectedGlobalScope.weight,
      thread: selectedGlobalScope.thread,
      backfocus: selectedGlobalScope.backfocus,
      type: selectedGlobalScope.type || 'Refractor',
      reqFlattener: selectedGlobalScope.type === 'Doublet',
      name: `${selectedGlobalScope.brand} ${selectedGlobalScope.model}`
    };
  }

  // Fully custom — only length and FR known
  if (cLen > 0) {
    return { len: cLen, weight: 0, thread: 'Unknown', backfocus: 55, type: (cFR >= 6 ? 'Doublet' : 'Refractor'), reqFlattener: (cFR >= 6), name: 'Custom Telescope' };
  }

  return null;
}

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
  const eff = getEffectiveScope();

  let html = `
    <div class="picker-header-row">
      <div class="col-part">Field Gear</div>
      <div class="col-selection">Status &amp; Recommendation</div>
      <div class="col-price">Price</div>
    </div>`;

  accessoryDefs.forEach(a => {
    let visible = true;
    let forceOn = false;
    let note = '';
    let rowClass = 'excluded';
    const hasScope = eff && eff.len > 0;
    const isRefractor = eff && ['Doublet','Triplet','Petzval','Quintuplet','Refractor'].includes(eff.type);
    const isSCT = eff && eff.type === 'SCT';
    const isNewtonian = eff && eff.type === 'Newtonian';
    const isAstrograph = eff && eff.type === 'Astrograph';
    const hasBuiltinCorrection = eff && ['Petzval','Quintuplet','SCT','Astrograph','Newtonian'].includes(eff.type);
    const hasCamera = cameraId !== 'none';
    const backfocus = eff ? eff.backfocus : 55;
    const isStandardBF = backfocus >= 50 && backfocus <= 60;

    // ── Flattener ──
    if (a.id === 'flattener') {
      if (!hasScope) {
        visible = true; note = 'Select a scope to evaluate compatibility';
      } else if (hasBuiltinCorrection) {
        visible = false; note = `Not needed — ${eff.type} design has built-in field correction`;
      } else if (eff.type === 'Doublet') {
        visible = true; forceOn = true; note = 'Required — doublet refractors need field flattening for sharp corners';
        rowClass = 'included';
      } else if (eff.type === 'Triplet') {
        visible = true; note = 'Optional — triplet is well-corrected; flattener tightens extreme edges';
      } else {
        visible = true; note = 'May improve edge performance on this optical design';
      }
    }

    // ── Spacers ──
    if (a.id === 'spacers') {
      if (!hasScope && !hasCamera) {
        visible = true; note = 'Select scope and camera to calculate spacer requirements';
      } else if (hasScope && hasCamera) {
        forceOn = true; rowClass = 'included';
        if (!isStandardBF) {
          note = `Required — this scope uses ${backfocus}mm backfocus; we calculate exact spacer stack`;
        } else {
          note = 'Required — included free with every scope + camera purchase';
        }
      } else if (hasCamera) {
        visible = true; note = 'Select a scope to calculate backfocus spacing';
      } else {
        visible = true; note = 'Select a camera to calculate backfocus spacing';
      }
    }

    // ── Dew Heater ──
    if (a.id === 'dewheater') {
      if (isSCT) {
        note = 'Critical — SCT corrector plates are extreme dew magnets';
        forceOn = true; rowClass = 'included';
      } else if (isNewtonian) {
        note = 'Recommended — open tubes fog secondary mirrors quickly';
      } else if (isAstrograph) {
        note = 'Recommended — fast optics with exposed corrector';
      } else if (eff && eff.type === 'Doublet' && eff.len < 400) {
        note = 'Recommended — doublets cool faster and fog earlier';
      } else if (eff && eff.len > 400) {
        note = 'Recommended — longer tubes collect more dew';
      } else if (hasScope) {
        note = 'Optional — good insurance for humid nights';
      } else {
        note = 'Optional — prevents fogged optics on any scope';
      }
    }

    // ── Bags & Cases ──
    if (a.id === 'bag' || a.id === 'bag_lg' || a.id === 'case' || a.id === 'case_xl') {
      if (isSCT || isNewtonian) {
        visible = false;
        note = `Designed for refractor tubes — not compatible with ${eff.type} form factor`;
      } else if (!hasScope) {
        visible = true; note = 'Select a scope to verify fit';
      }
      // Length-based rules for refractors
      if (isRefractor || (!isSCT && !isNewtonian)) {
        if (a.id === 'bag') {
          if (hasScope && eff.len <= 380) note = `Verified fit — ${eff.len}mm within 380mm max`;
          else if (hasScope && eff.len > 380) { visible = false; note = `Too small — ${eff.len}mm exceeds 380mm max`; }
        }
        if (a.id === 'bag_lg') {
          if (hasScope && eff.len > 380 && eff.len <= 620) note = `Verified fit — ${eff.len}mm within 381-620mm range`;
          else if (hasScope && eff.len <= 380) { visible = false; note = `Overkill — ${eff.len}mm fits the small bag`; }
          else if (hasScope && eff.len > 620) { visible = false; note = `Too large — ${eff.len}mm exceeds 620mm max`; }
        }
        if (a.id === 'case') {
          if (hasScope && eff.len <= 520) note = `Verified fit — ${eff.len}mm within 520mm max`;
          else if (hasScope && eff.len > 520) { visible = false; note = `Too small — ${eff.len}mm exceeds 520mm max`; }
        }
        if (a.id === 'case_xl') {
          if (hasScope && eff.len > 520) note = `Verified fit — ${eff.len}mm fits the XL case`;
          else if (hasScope && eff.len <= 520 && eff.len > 0) { visible = true; note = 'Fits — but the small case is more compact'; }
        }
      }
    }

    // ── Tripod ──
    if (a.id === 'tripod') {
      if (eff && eff.weight > 8) {
        note = `WARNING — ${eff.weight}kg exceeds the 8kg payload limit`;
      } else if (eff && eff.weight > 5) {
        note = `${eff.weight}kg scope — within the 8kg payload rating`;
      } else if (eff && eff.weight > 0) {
        note = `${eff.weight}kg scope — well within the 8kg payload limit`;
      } else {
        note = 'Select a scope for weight verification';
      }
    }

    const price = dbPrices[a.priceKey] ? `$${dbPrices[a.priceKey].toFixed(2)}` : '...';

    html += `
      <div class="picker-row ${rowClass}" id="row_${a.id}" style="${visible ? '' : 'display:none;'}">
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

// ── Cart System ──
const CART_KEY = 'uranus_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartBadge();
}

function addToCart(id, name, price) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id, name, price: parseFloat(price) || 0, qty: 1 }); }
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

function updateCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) { item.qty = Math.max(0, qty); if (item.qty === 0) return removeFromCart(id); }
  saveCart(cart);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function clearCart() { saveCart([]); }

function renderCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function renderCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  const cart = getCart();

  if (cart.length === 0) {
    drawer.innerHTML = `<div class="cart-header"><h3>Mission Manifest</h3><button class="cart-close" onclick="toggleCart()">×</button></div><div class="cart-empty">No gear loaded. Probe Uranus responsibly.</div>`;
    return;
  }

  const items = cart.map(i => `
    <div class="cart-item">
      <div class="cart-item-info"><div class="cart-item-name">${i.name}</div><div class="cart-item-price">$${i.price.toFixed(2)}</div></div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="updateCartQty('${i.id}',${i.qty-1})">−</button>
        <span class="cart-qty">${i.qty}</span>
        <button class="cart-qty-btn" onclick="updateCartQty('${i.id}',${i.qty+1})">+</button>
        <button class="cart-remove" onclick="removeFromCart('${i.id}');renderCartDrawer()" title="Remove">🗑</button>
      </div>
    </div>`).join('');

  drawer.innerHTML = `
    <div class="cart-header"><h3>Mission Manifest</h3><button class="cart-close" onclick="toggleCart()">×</button></div>
    <div class="cart-items">${items}</div>
    <div class="cart-footer">
      <div class="cart-total"><span>Total</span><strong>$${cartTotal().toFixed(2)}</strong></div>
      <button class="cart-checkout-btn" onclick="checkoutCart()">SECURE PAYLOAD</button>
      <button class="cart-clear-btn" onclick="clearCart();renderCartDrawer()">Clear Manifest</button>
    </div>`;
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  renderCartDrawer();
  drawer.classList.toggle('open');
}

async function checkoutCart() {
  const cart = getCart();
  if (!cart.length) return;
  const items = cart.map(i => `${i.id}:${i.qty}`).join(',');
  try {
    const res = await fetch(`/api/uranus/checkout_hardware?items=${items}`);
    const data = await res.json();
    if (data.url) { clearCart(); window.location.href = data.url; }
    else alert('Mission Control could not process. Try again.');
  } catch {
    alert('Checkout failed. Mission Control is looking into it.');
  }
}

// Backwards compat for existing loose debris product buttons
function checkoutHardware(id) {
  const names = {
    glancer:'Uranus Glancer 80ED', penetrator:'Uranus Penetrator 9000', panoramic:'Uranus Panoramic 60mm',
    snapshot533:'Uranus Snapshot 533', deepgaze571:'Uranus DeepGaze 571', omnivision455:'Uranus Omnivision 455',
    steadygaze:'Uranus SteadyGaze GTi', hm17:'Uranus DeepTracker HM-17', am3:'Uranus OrbitLock AM3'
  };
  addToCart(id, names[id] || id, 0);
  toggleCart();
}

document.addEventListener('DOMContentLoaded', () => { renderCartBadge(); });

// ── Configurator Init ──
document.addEventListener('DOMContentLoaded', initData);
if (byId('builderControls')) {
  byId('builderControls').addEventListener('change', (e) => {
    if (e.target.id === 'scopeSelect') renderAccessories();
    updateConfigurator();
  });
  byId('customScopeLen').addEventListener('input', () => { renderAccessories(); updateConfigurator(); });
  byId('customScopeFR').addEventListener('input', updateConfigurator);
}
