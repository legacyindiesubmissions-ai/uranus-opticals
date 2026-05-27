/* ═══════════════════════════════════════════
   URANUS OPTICALS — Riot Motoco Standard Engine
   ═══════════════════════════════════════════ */

let dbPrices = {};
let globalScopes = [];
let selectedGlobalScope = null;
let analysisUnlocked = false;

const scopes = {
  none:       { name: "Custom Profile Active",                      backfocus: 0,  thread: "N/A", weight: 0,   len: 0,   reqFlattener: false, desc: "Input your specific telescope requirements." },
  glancer:    { name: "Uranus Glancer (Svbony 80ED)",         backfocus: 55, thread: "M48", weight: 3.9, len: 470, reqFlattener: true, desc: "High-value doublet refractor for deep sky entry." },
  penetrator: { name: "Uranus Penetrator (Askar FRA300)",       backfocus: 55, thread: "M48", weight: 3.1, len: 303, reqFlattener: false, desc: "Ultra-fast Petzval travel scope. No flattener needed." },
  panoramic:  { name: "Uranus Panoramic (Signature 80 APO)",   backfocus: 55, thread: "M54", weight: 5.2, len: 410, reqFlattener: false, desc: "Premium triplet apochromat for large sensors." }
};

const cameras = {
  none:          { name: "None / Have my own",                         depth: 0,    thread: "N/A", weight: 0, desc: "I will provide my own imaging sensor." },
  snapshot533:   { name: "Uranus 533C (Starter)",        depth: 17.5, thread: "M42", weight: 0.42, desc: "Square sensor, zero amp-glow, high sensitivity." },
  deepgaze571:   { name: "Uranus 571C (Professional)",        depth: 17.5, thread: "M42", weight: 0.68, desc: "APS-C sensor, 26MP, extreme dynamic range." },
  omnivision455: { name: "Uranus 455C (Full Frame)", depth: 17.5, thread: "M42", weight: 0.72, desc: "Full-frame 61MP resolution for giant targets." }
};

const mounts = {
  none:       { name: "None / Have my own",                capacity: 999 },
  steadygaze: { name: "Sky-Watcher GTi (Light duty)",      capacity: 5  },
  am3:        { name: "ZWO AM3N (Medium load)",            capacity: 8  },
  hm17:       { name: "Uranus Harmonic 17 (Heavy handler)", capacity: 15 }
};

const accessories = [
  { id: 'flattener', name: 'Field Flattener', value: 'acc_flattener', desc: 'Corrects field curvature for sharp stars at the edges.' },
  { id: 'spacers', name: 'M42/M48 Spacer Kit', value: 'acc_spacers', desc: 'Essential for reaching exact 55mm backfocus distance.' },
  { id: 'guidescope', name: '30mm Guide Scope', value: 'acc_guidescope', desc: 'Small scope for high-precision tracking corrections.' },
  { id: 'guidecam', name: 'Ceres Guide Camera', value: 'acc_guidecam', desc: 'High-speed mono sensor for locked-on tracking.' },
  { id: 'filter', name: 'L-Pro Light Pollution Filter', value: 'acc_filter', desc: 'Saturates nebulae while cutting city light pollution.' },
  { id: 'bag', name: 'Padded Storage Bag (Small)', value: 'acc_bag_scope', desc: 'Fits scopes up to 380mm retracted.' },
  { id: 'bag_lg', name: 'XL Padded Bag (65cm)', value: 'acc_bag_lg', desc: 'Heavy duty padded shell for large refractors.' },
  { id: 'case', name: 'Hard Case w/ Pluck Foam', value: 'acc_case_hard', desc: 'Waterproof rugged protection with custom foam.' },
  { id: 'case_xl', name: 'XL Hard Case (60cm)', value: 'acc_case_xl', desc: 'Deep protection for large imaging rigs.' },
  { id: 'power', name: '12V Power Bank', value: 'acc_power', desc: '60Wh capacity to run the mount for 4-6 hours.' }
];

function byId(id) { return document.getElementById(id); }

async function init() {
  console.log("Mission Control: Initializing Riot Standard Engine...");
  try {
    const [pRes, sRes] = await Promise.all([
      fetch("/api/uranus/prices"),
      fetch("global_scopes.json")
    ]);
    if (pRes.ok) dbPrices = await pRes.json();
    if (sRes.ok) globalScopes = await sRes.json();
  } catch (e) { console.error("API Error:", e); }
  
  renderAccessories();
  setupEventListeners();
  updateUI();
}

function renderAccessories() {
  const list = byId("accessoryList");
  list.innerHTML = accessories.map(acc => `
    <div class="picker-row excluded" id="row-${acc.id}">
      <div class="col-part">
        <h4>${acc.name}</h4>
        <span class="comp-meta">ID: <code>${acc.value}</code></span>
      </div>
      <div class="col-selection">
        <select class="tier-select acc-select" data-id="${acc.id}" id="select-${acc.id}">
          <option value="no">❌ Exclude</option>
          <option value="yes">✅ Include in Rig</option>
        </select>
        <div class="specs-box">
          <p class="specs-desc">${acc.desc}</p>
          <span id="note-${acc.id}" class="stock-badge">Optional</span>
        </div>
      </div>
      <div class="col-price" id="price-${acc.id}">$0.00</div>
    </div>
  `).join("");
}

function setupEventListeners() {
  const controls = ["scopeSelect", "cameraSelect"];
  controls.forEach(id => byId(id).addEventListener("change", updateUI));
  
  document.querySelectorAll(".acc-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const row = byId(`row-${e.target.dataset.id}`);
      if (e.target.value === 'yes') row.classList.add("included");
      else row.classList.remove("included");
      updateUI();
    });
  });

  byId("scopeSearch").addEventListener("input", handleSearch);
  byId("customScopeLen").addEventListener("input", updateUI);
  byId("customScopeFR").addEventListener("input", updateUI);
  byId("btnCheckoutRig").onclick = () => {
    if (byId("btnCheckoutRig").textContent === "RUN MISSION SIMULATION") startSimulation();
    else checkoutRig();
  };
}

function handleSearch() {
  const val = byId("scopeSearch").value.toLowerCase();
  const sugg = byId("searchSuggestions");
  sugg.innerHTML = "";
  if (val.length < 2) { sugg.style.display="none"; return; }
  const matches = globalScopes.filter(s => s.brand.toLowerCase().includes(val) || s.model.toLowerCase().includes(val)).slice(0,5);
  if (matches.length > 0) {
    matches.forEach(m => {
      const d = document.createElement("div");
      d.style.padding = "10px"; d.style.cursor="pointer"; d.style.borderBottom="1px solid var(--border)";
      d.innerHTML = `<strong>${m.brand} ${m.model}</strong><br><small>${m.len}mm | ${m.type}</small>`;
      d.onclick = () => {
        selectedGlobalScope = m;
        byId("scopeSearch").value = m.brand + " " + m.model;
        byId("customScopeLen").value = m.len;
        sugg.style.display="none";
        analysisUnlocked = false;
        updateUI();
      };
      sugg.appendChild(d);
    });
    sugg.style.display="block";
  }
}

function updateUI() {
  const sId = byId("scopeSelect").value;
  const cId = byId("cameraSelect").value;
  
  // Custom scope form visibility
  byId("customScopeForm").style.display = (sId === 'none') ? 'block' : 'none';

  const scope = (sId === 'none' && selectedGlobalScope) ? { ...selectedGlobalScope, name: selectedGlobalScope.model } : scopes[sId];
  const camera = cameras[cId];

  // Update Core Specs
  byId("scopeSpecs").textContent = scope.desc || "";
  byId("cameraSpecs").textContent = camera.desc || "";
  byId("scopePriceDisplay").textContent = "$" + (dbPrices[sId] || 0).toFixed(2);
  byId("cameraPriceDisplay").textContent = "$" + (dbPrices[cId] || 0).toFixed(2);

  // Dynamic Fitment Logic
  const eLen = (sId === 'none') ? (parseFloat(byId("customScopeLen").value) || 0) : scope.len;
  
  accessories.forEach(acc => {
    const row = byId(`row-${acc.id}`);
    const sel = byId(`select-${acc.id}`);
    const note = byId(`note-${acc.id}`);
    const price = byId(`price-${acc.id}`);
    price.textContent = "$" + (dbPrices[acc.value] || 0).toFixed(2);

    let show = true;
    let force = false;
    let status = "Optional";

    if (acc.id === 'flattener') {
      if (sId === 'glancer') { force = true; status = "REQUIRED FOR 80ED"; }
      else if (scope.type === 'Petzval') show = false;
    } else if (acc.id === 'bag') {
      if (eLen > 0 && eLen <= 380) status = "PERFECT FIT";
      else if (eLen > 380) show = false;
    } else if (acc.id === 'bag_lg') {
      if (eLen > 380 && eLen <= 620) status = "CONFIRMED FIT";
      else if (eLen <= 380) show = false;
    } else if (acc.id === 'spacers') {
      if (sId !== 'none' && cId !== 'none') { force = true; status = "REQUIRED"; }
    }

    row.style.display = show ? "grid" : "none";
    if (force) { sel.value = "yes"; sel.disabled = true; row.classList.add("included"); }
    else { sel.disabled = false; }
    note.textContent = status;
    note.className = "stock-badge " + (force ? "in-stock" : "");
  });

  // Sidebar Manifest
  let total = (dbPrices[sId] || 0) + (dbPrices[cId] || 0);
  let html = `<div class="selected-item"><span>${scope.name}</span><span>$${(dbPrices[sId]||0).toFixed(2)}</span></div>`;
  html += `<div class="selected-item"><span>${camera.name}</span><span>$${(dbPrices[cId]||0).toFixed(2)}</span></div>`;
  
  let count = 2;
  accessories.forEach(acc => {
    if (byId(`select-${acc.id}`).value === 'yes') {
      total += (dbPrices[acc.value] || 0);
      html += `<div class="selected-item"><span>${acc.name}</span><span>$${(dbPrices[acc.value]||0).toFixed(2)}</span></div>`;
      count++;
    }
  });

  byId("manifestList").innerHTML = html;
  byId("selectedCount").textContent = count + " Items";
  byId("rigTotal").textContent = "$" + total.toFixed(2);

  // Fitment Status
  if (sId === 'none' && !analysisUnlocked) {
    byId("resultStatus").textContent = "PENDING ANALYSIS";
    byId("spacerResult").innerHTML = '<span style="filter:blur(3px)">xx.x mm</span>';
    byId("adapterResult").innerHTML = '<span style="filter:blur(3px)">Mxx to Mxx</span>';
    byId("btnCheckoutRig").textContent = "RUN MISSION SIMULATION";
    byId("btnCheckoutRig").classList.add("btn-primary");
  } else {
    byId("resultStatus").textContent = "CLEARED FOR CONTACT";
    const bf = scope.backfocus - camera.depth;
    byId("spacerResult").textContent = bf.toFixed(1) + "mm Required";
    byId("adapterResult").textContent = scope.thread === camera.thread ? "Direct " + scope.thread : scope.thread + " to " + camera.thread;
    byId("btnCheckoutRig").textContent = "SECURE YOUR RIG";
  }
}

function startSimulation() {
  const overlay = byId("simulationOverlay");
  const progress = byId("simProgress");
  const ticker = byId("logTicker");
  overlay.style.display = "flex";
  
  const jokes = [
    "Probing the absolute depths of Uranus...",
    "Adjusting focus for a closer look at Uranus...",
    "Ensuring the payload slides easily into Uranus...",
    "Uranus is looking quite round today."
  ];

  let p = 0;
  const intv = setInterval(() => {
    p += 1;
    progress.style.width = p + "%";
    if (p % 25 === 0) ticker.innerHTML = `<div>> ${jokes[Math.floor(p/25)-1]}</div>` + ticker.innerHTML;
    if (p >= 100) {
      clearInterval(intv);
      setTimeout(() => {
        overlay.style.display = "none";
        byId("paywallModal").style.display = "flex";
      }, 800);
    }
  }, 100);
}

byId("btnUnlockAnalysis").onclick = () => {
  analysisUnlocked = true;
  byId("paywallModal").style.display = "none";
  updateUI();
};

async function checkoutRig() {
  const items = [];
  if (byId("scopeSelect").value !== 'none') items.push(byId("scopeSelect").value);
  if (byId("cameraSelect").value !== 'none') items.push(byId("cameraSelect").value);
  accessories.forEach(acc => { if(byId(`select-${acc.id}`).value === 'yes') items.push(acc.value); });
  
  const res = await fetch(`/api/uranus/checkout_hardware?items=${items.join(',')}`);
  const data = await res.json();
  if (data.url) window.location.href = data.url;
}

document.addEventListener("DOMContentLoaded", init);
