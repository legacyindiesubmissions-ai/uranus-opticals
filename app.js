/* ═══════════════════════════════════════════
   URANUS OPTICALS — Mission Ready-Sourced Deep Scope Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

// Joke intensity
function setJokeIntensity(level) {
  localStorage.setItem('jokeIntensity', level);
  
  if (level === 'apocalyptic') {
    document.body.style.setProperty('--accent', '#ff6b9d');
    document.body.style.setProperty('--accent-glow', '#ff8fb3');
    document.body.style.setProperty('--hot', '#ff3366');
    applyApocalypticJokes();
  } else if (level === 'extreme') {
    document.body.style.setProperty('--accent', '#8ec8e0');
    document.body.style.setProperty('--accent-glow', '#b0ddf0');
    document.body.style.setProperty('--hot', '#e0558a');
  } else {
    document.body.style.setProperty('--accent', '#7eb8da');
    document.body.style.setProperty('--accent-glow', '#a0d0f0');
    document.body.style.setProperty('--hot', '#e0558a');
  }
}

function applyApocalypticJokes() {
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const words = [
    /planet/gi, /stars/gi, /space/gi, /\bit\b/gi, /hole/gi, 
    /telescope/gi, /equipment/gi, /gear/gi, /system/gi, /view/gi,
    /astrophotography/gi, /universe/gi, /galaxy/gi, /nebula/gi
  ];
  while(node = walk.nextNode()) {
    let text = node.nodeValue;
    words.forEach(re => {
      text = text.replace(re, "Uranus");
    });
    node.nodeValue = text;
  }
  // Recount jokes after injection
  setTimeout(() => {
    if (typeof countJokes === 'function') countJokes();
  }, 100);
}

function cycleJokeIntensity() {
  const intensities = ['unbearable', 'extreme', 'apocalyptic'];
  const current = localStorage.getItem('jokeIntensity') || 'unbearable';
  let nextIdx = (intensities.indexOf(current) + 1) % intensities.length;
  const next = intensities[nextIdx];
  
  if (current === 'apocalyptic' && next === 'unbearable') {
    localStorage.setItem('jokeIntensity', next);
    location.reload();
  } else {
    setJokeIntensity(next);
  }
}

// Theme
function setTheme(theme) {
  localStorage.setItem('uranusTheme', theme);
  if (theme === 'brown') {
    document.body.style.setProperty('--space', '#1a1008');
    document.body.style.setProperty('--deep', '#241810');
    document.body.style.setProperty('--surface', '#2d1f14');
    document.body.style.setProperty('--border', '#4a3522');
    document.body.style.setProperty('--accent', '#d4a76a');
    document.body.style.setProperty('--accent-glow', '#e8c48a');
  } else {
    document.body.style.setProperty('--space', '#070b14');
    document.body.style.setProperty('--deep', '#0d1326');
    document.body.style.setProperty('--surface', '#131b33');
    document.body.style.setProperty('--border', '#1e2d52');
    document.body.style.setProperty('--accent', '#7eb8da');
    document.body.style.setProperty('--accent-glow', '#a0d0f0');
  }
}

function cycleTheme() {
  const current = localStorage.getItem('uranusTheme') || 'default';
  const next = current === 'default' ? 'brown' : 'default';
  setTheme(next);
}

function initTweaks() {
  const theme = localStorage.getItem('uranusTheme') || 'default';
  const intensity = localStorage.getItem('jokeIntensity') || 'unbearable';
  setTheme(theme);
  setJokeIntensity(intensity);
}

function initCartUI() {
  if (document.getElementById('cartFloat')) return;
  const cartHtml = `
    <div class="cart-float" id="cartFloat" onclick="toggleCart()">
      <span class="cart-icon">&#128722;</span>
      <span class="cart-badge" id="cartBadge" style="display:none">0</span>
    </div>
    <div class="cart-drawer" id="cartDrawer"></div>`;
  document.body.insertAdjacentHTML('beforeend', cartHtml);
}

// ── EXPOSE TO WINDOW FOR INLINE HTML HANDLERS ──
window.setJokeIntensity = setJokeIntensity;
window.setTheme = setTheme;
window.cycleJokeIntensity = cycleJokeIntensity;
window.cycleTheme = cycleTheme;

document.addEventListener('DOMContentLoaded', () => {


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
  const scopeSelect = byId("searchScopeSelect");
  
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
    ).slice(0, 8);

    if (matches.length > 0) {
      const sel = document.createElement("select");
      sel.id = "searchScopeSelect";
      sel.size = Math.min(matches.length + 1, 6);
      sel.style.cssText = "width:100%;background:var(--deep);border:1px solid var(--ice);color:var(--text);padding:8px;border-radius:6px;font-size:0.8rem;cursor:pointer;";
      
      const opt = document.createElement("option");
      opt.textContent = `— Select your telescope (${matches.length} matches) —`;
      opt.disabled = true;
      opt.selected = true;
      sel.appendChild(opt);

      matches.forEach(m => {
        const o = document.createElement("option");
        o.textContent = `${m.brand} ${m.model} (${m.type}, ${m.len}mm)`;
        o.value = m.id;
        o.dataset.brand = m.brand;
        o.dataset.model = m.model;
        sel.appendChild(o);
      });

      sel.addEventListener("change", () => {
        if (sel.selectedIndex > 0) {
          const m = matches[sel.selectedIndex - 1];
          selectGlobalScope(m);
        }
      });

      suggestions.innerHTML = "";
      suggestions.appendChild(sel);
      suggestions.style.display = "block";
    } else {
      suggestions.innerHTML = "<div style='padding:10px;color:var(--muted);font-size:0.8rem;'>No telescopes found. Try a different search.</div>";
      suggestions.style.display = "block";
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target !== searchInput && !suggestions.contains(e.target)) {
      suggestions.style.display = "none";
    }
  });
}

function selectGlobalScope(scope) {
  selectedGlobalScope = scope;
  localStorage.setItem('uranusLastScope', JSON.stringify(scope));
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
    'price_bag_300': dbPrices.acc_bag_300, 'price_bag_400': dbPrices.acc_bag_400,
    'price_bag_520': dbPrices.acc_bag_520, 'price_bag_650': dbPrices.acc_bag_650,
    'price_bag_800': dbPrices.acc_bag_800, 'price_bag_xxl': dbPrices.acc_bag_xxl,
    'price_case_300': dbPrices.acc_case_300, 'price_case_400': dbPrices.acc_case_400,
    'price_case_520': dbPrices.acc_case_520, 'price_case_650': dbPrices.acc_case_650,
    'price_case_800': dbPrices.acc_case_800, 'price_case_xxl': dbPrices.acc_case_xxl,
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
  {id: 'bag_300',    name: 'Padded Bag — Micro (≤300mm)',   desc: 'Fits tiny scopes up to 300mm. RedCat 51, ZS61, guide scope kits.',       priceKey: 'acc_bag_300',   tier: '300' },
  {id: 'bag_400',    name: 'Padded Bag — Small (301-400mm)', desc: 'Fits compact refractors 301-400mm. RedCat 61/71, ZS73, GT71, Evostar 72ED.', priceKey: 'acc_bag_400',   tier: '400' },
  {id: 'bag_520',    name: 'Padded Bag — Medium (401-520mm)', desc: 'Fits mid-size scopes 401-520mm. RedCat 91, ZS81, Esprit 80ED, FRA500.',priceKey: 'acc_bag_520',   tier: '520' },
  {id: 'bag_650',    name: 'Padded Bag — Large (521-650mm)', desc: 'Fits full-size refractors 521-650mm. ZS103, GT102, FLT120, Esprit 100ED.',priceKey: 'acc_bag_650',   tier: '650' },
  {id: 'bag_800',    name: 'Padded Bag — XL (651-800mm)',   desc: 'Fits big glass 651-800mm. ZS126, FLT132, Esprit 120ED, 120APO.',          priceKey: 'acc_bag_800',   tier: '800' },
  {id: 'bag_xxl',    name: 'Padded Bag — XXL (801mm+)',     desc: 'Fits massive refractors 801mm+. Esprit 150ED, 140APO, 185APO.',           priceKey: 'acc_bag_xxl',   tier: 'xxl' },
  {id: 'case_300',   name: 'Hard Case — Micro (≤300mm)',    desc: 'Waterproof hard shell for scopes up to 300mm. Pluck foam interior.',     priceKey: 'acc_case_300',  tier: '300' },
  {id: 'case_400',   name: 'Hard Case — Small (301-400mm)', desc: 'Waterproof protection for scopes 301-400mm. Crushproof.',                 priceKey: 'acc_case_400',  tier: '400' },
  {id: 'case_520',   name: 'Hard Case — Medium (401-520mm)', desc: 'Rugged hard case for scopes 401-520mm. Pressure valve, lockable.',       priceKey: 'acc_case_520',  tier: '520' },
  {id: 'case_650',   name: 'Hard Case — Large (521-650mm)', desc: 'Heavy-duty protection for scopes 521-650mm. Pluck foam + egg-crate.',     priceKey: 'acc_case_650',  tier: '650' },
  {id: 'case_800',   name: 'Hard Case — XL (651-800mm)',    desc: 'Maximum protection for scopes 651-800mm. Lockable, waterproof.',          priceKey: 'acc_case_800',  tier: '800' },
  {id: 'case_xxl',   name: 'Hard Case — XXL (801mm+)',     desc: 'Industrial-grade case for scopes 801mm+. Custom foam, reinforced shell.',  priceKey: 'acc_case_xxl',  tier: 'xxl' },
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

    // ── Bags & Cases (tiered by scope length) ──
    if (a.tier) {
      const tierMax = a.tier === 'xxl' ? Infinity : parseInt(a.tier);
      const tierMin = (() => {
        const tiers = ['300','400','520','650','800','xxl'];
        const idx = tiers.indexOf(a.tier);
        if (idx === 0) return 1;
        return parseInt(tiers[idx - 1]) + 1;
      })();

      if (isSCT) {
        visible = false; note = 'Designed for refractor tubes — SCTs have different form factor';
      } else if (isNewtonian) {
        visible = false; note = 'Designed for refractor tubes — Newtonians need tube rings, not bags';
      } else if (isAstrograph) {
        visible = false; note = 'Astrograph form factor requires custom case solution — contact us';
      } else if (!hasScope) {
        visible = true; note = 'Select a scope to match the correct case size';
      } else if (eff.len >= tierMin && eff.len <= tierMax) {
        visible = true; note = `Matched — your ${eff.len}mm scope fits this ${a.tier}mm tier`;
      } else {
        visible = false;
        if (eff.len < tierMin) note = `Oversized — your ${eff.len}mm scope fits a smaller tier`;
        else note = `Too small — your ${eff.len}mm scope needs a larger tier`;
      }
    }

    // ── Tripod ──
    if (a.id === 'tripod') {
      if (eff && eff.weight > 8) {
        note = `WARNING — ${eff.weight}kg exceeds the 8kg payload limit`;
        visible = false;
      } else if (eff && eff.weight > 5) {
        note = `${eff.weight}kg scope — within the 8kg payload rating`;
      } else if (eff && eff.weight > 0) {
        note = `${eff.weight}kg scope — well within the 8kg payload limit`;
      } else {
        note = 'Select a scope for weight verification';
      }
    }

    // ── BYO Accessory Filter ──
    if (scopeId === 'none' && hasScope) {
       // Only show relevant gear for the matched BYO scope
       if (a.id === 'flattener' && !isRefractor) visible = false;
       if (a.id === 'spacers' && !hasCamera) visible = false;
    }

    // ── Catch-all: no scope selected ──
    if (!note && !hasScope) {
      note = 'Search for your telescope below to verify compatibility';
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
          <button class="acc-addcart" data-key="${a.priceKey}" data-name="${a.name}"
            style="margin-top:8px;width:100%;background:var(--accent);color:#04101f;border:none;padding:8px 10px;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.8rem;">
            + Add to Cart
          </button>
        </div>
      </div>`;
  });

  container.innerHTML = html;

  // Bind per-accessory add-to-cart so BYO customers can stack multiple parts
  container.querySelectorAll('.acc-addcart').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      addToCart(key, btn.dataset.name, dbPrices[key] || 0);
      toggleCart();
    });
  });

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
  // Configurator-only: bail cleanly on pages without it (e.g. loose-debris).
  if (!byId("scopeSelect")) return;
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
    selectedGlobalScope = null; // RESET BYO match when switching back to presets
  }

  const scope  = getEffectiveScope();
  const camera = cameras[cameraId];
  const mount  = mounts[mountId];

  // BYO gating: until the customer pays the $5 quote, hide the camera + mount
  // pickers AND the accessory wall. Everything in the results unlocks together
  // only after payment clears (analysisUnlocked). Presets are never gated.
  const isBYO = (scopeId === 'none');
  const hasMatch = (selectedGlobalScope !== null);
  const byoLocked = isBYO && !analysisUnlocked;

  const cameraField = byId('cameraField');
  const mountField = byId('mountField');
  if (cameraField) cameraField.style.display = byoLocked ? 'none' : '';
  if (mountField) mountField.style.display = byoLocked ? 'none' : '';

  const accPicker = byId('accessoryPicker');
  if (accPicker) {
    // Accessories show only once BYO is paid AND a telescope is matched.
    const showAcc = !isBYO || (analysisUnlocked && hasMatch);
    const pickerHeader = accPicker.previousElementSibling;
    accPicker.style.display = showAcc ? 'block' : 'none';
    if (pickerHeader && pickerHeader.classList.contains('controls-title')) {
      pickerHeader.style.display = showAcc ? 'flex' : 'none';
    }
  }

  // No valid rig yet (BYO with no telescope match) — clear the total so the
  // price always reflects the live selection instead of a stale preset value.
  if (!scope || !camera || !mount) {
    const rigTotalEmpty = byId("rigTotal");
    if (rigTotalEmpty) rigTotalEmpty.textContent = "$0.00";
    return;
  }

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
  let lastJokeIdx = -1;

  // Seed the ticker with a random joke immediately so it never starts empty
  const seedJoke = Math.floor(Math.random() * jokes.length);
  lastJokeIdx = seedJoke;
  ticker.innerHTML = `<div style="animation: fadeIn 0.5s;">${jokes[seedJoke]}</div>`;

  const interval = setInterval(() => {
    p += 0.5;
    progress.style.width = p + "%";

    if (p % 15 === 0) {
      let next;
      do { next = Math.floor(Math.random() * jokes.length); } while (jokes.length > 1 && next === lastJokeIdx);
      lastJokeIdx = next;
      ticker.innerHTML = `<div style="animation: fadeIn 0.5s;">${jokes[next]}</div>` + ticker.innerHTML;
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

// Paywall → real $5 Stripe quote checkout. Recipe is delivered server-side
// only after payment clears (see checkQuoteReturn).
// Guarded: this element only exists on the configurator page, not loose-debris.
const unlockBtn = byId("btnUnlockAnalysis");
if (unlockBtn) unlockBtn.onclick = async () => {
  const btn = byId("btnUnlockAnalysis");
  const scope = getEffectiveScope();
  if (!scope) {
    alert("Search and match your telescope first so we can quote your fitment.");
    return;
  }
  btn.textContent = "CONNECTING TO PROBE...";
  const cam = cameras[byId("cameraSelect").value];
  const params = new URLSearchParams({
    scope_backfocus: scope.backfocus ?? 55,
    scope_thread: scope.thread ?? "",
    scope_len: scope.len ?? "",
    cam_depth: (cam && cam.depth) ? cam.depth : "",
    cam_thread: (cam && cam.thread) ? cam.thread : ""
  });
  try {
    const res = await fetch(`/api/uranus/checkout_quote?${params.toString()}`);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Could not start quote checkout. Try again.");
      btn.textContent = "Unlock Mission Data";
    }
  } catch {
    alert("Connection to Mission Control failed.");
    btn.textContent = "Unlock Mission Data";
  }
};

// On return from a paid Stripe quote, verify server-side and reveal the recipe.
async function checkQuoteReturn() {
  const sid = new URLSearchParams(location.search).get('quote_paid');
  if (!sid) return;
  try {
    const res = await fetch(`/api/uranus/quote_result?session_id=${encodeURIComponent(sid)}`);
    const data = await res.json();
    if (data.paid) {
      analysisUnlocked = true;
      byId("paywallModal").style.display = "none";
      // Restore the telescope they were quoting so the accessory list populates
      const saved = localStorage.getItem('uranusLastScope');
      if (saved && byId("scopeSelect").value === 'none') {
        try {
          selectedGlobalScope = JSON.parse(saved);
          byId("selectedScopeLabel").textContent = `${selectedGlobalScope.brand} ${selectedGlobalScope.model} Profile Loaded`;
          byId("scopeSearch").value = `${selectedGlobalScope.brand} ${selectedGlobalScope.model}`;
        } catch {}
      }
      updateConfigurator();
      // Overwrite with server-verified recipe (authoritative)
      byId("adapterResult").textContent = data.adapter;
      byId("spacerResult").textContent = data.spacer;
    }
  } catch {}
  // Strip the param so a refresh can't replay it
  history.replaceState({}, '', location.pathname + '#configurator');
}

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
  const items = cart.map(i => i.id).join(',');
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
  const price = dbPrices[id] || 0;
  addToCart(id, names[id] || id, price);
  toggleCart();
}

renderCartBadge();

// Expose cart handlers for inline onclick (loose-debris buttons + cart drawer).
// These live inside the DOMContentLoaded closure, so inline handlers can't see
// them without this — that's why the cart was previously non-functional.
window.checkoutHardware = checkoutHardware;
window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;
window.checkoutCart = checkoutCart;
window.clearCart = clearCart;

// ── Configurator Init ──
initData().then(checkQuoteReturn);
if (byId('builderControls')) {
  byId('builderControls').addEventListener('change', (e) => {
    if (e.target.id === 'scopeSelect') {
      if (e.target.value === 'none') {
        byId('cameraSelect').value = 'none';
        byId('mountSelect').value = 'none';
      }
      renderAccessories();
    }
    updateConfigurator();
  });
  byId('customScopeLen').addEventListener('input', () => { renderAccessories(); updateConfigurator(); });
  byId('customScopeFR').addEventListener('input', updateConfigurator);
}


// ── INLINE SCRIPTS MOVED FROM HTML ──
// Tweaks panel toggle
const toggle = document.getElementById('tweaksToggle');
const panel = document.getElementById('tweaksPanel');
if (toggle && panel) {
  toggle.addEventListener('click', () => panel.classList.toggle('open'));
}

// Joke counter
let jokeCount = 0;
async function countJokes() {
  try {
    const pages = ['index.html', 'loose-debris.html', 'community.html'];
    let totalMatches = 0;
    
    for (const page of pages) {
      const res = await fetch(page);
      if (!res.ok) continue;
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      if (doc.body) {
        // Remove script and style tags so we don't count code references
        const scripts = doc.body.querySelectorAll('script, style');
        scripts.forEach(s => s.remove());
        let bodyText = doc.body.textContent;
        if (localStorage.getItem('jokeIntensity') === 'apocalyptic') {
          bodyText = bodyText.replace(/\b(planet|stars|space|it|hole|telescope|equipment|gear|system|view|astrophotography|universe|galaxy|nebula)\b/gi, "Uranus");
        }
        const matches = bodyText.match(/Uranus/gi);
        totalMatches += matches ? matches.length : 0;
      }
    }
    
    jokeCount = totalMatches;
    const counter = document.getElementById('jokeCounter');
    if (counter) {
      counter.textContent = jokeCount + ' Uranus references detected across the site. You\'re welcome.';
    }
    const tc = document.getElementById('tweakJokeCount');
    if (tc) tc.textContent = jokeCount;
  } catch (err) {
    console.error("Joke counting failed:", err);
  }
}
countJokes();

initTweaks();
initCartUI();
countJokes();

});
