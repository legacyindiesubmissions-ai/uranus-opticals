/* ═══════════════════════════════════════════
   URANUS OPTICALS — Deep Scope Bundle Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

let dbPrices = {};

const scopes = {
  none:       { name: "None / Have my own",                         backfocus: 0,  thread: "N/A", weight: 0,   reqFlattener: false },
  glancer:    { name: "Svbony SV503 80ED (Beginner Probe)",         backfocus: 55, thread: "M48", weight: 2.7, reqFlattener: true },
  penetrator: { name: "Askar FRA300 Pro (The Deep Explorer)",       backfocus: 55, thread: "M48", weight: 2.9, reqFlattener: false },
  panoramic:  { name: "Uranus Signature 80 APO (Full Insertion)",   backfocus: 55, thread: "M54", weight: 3.2, reqFlattener: false }
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
  hm17:       { name: "Uranus Harmonic 17 (Heavy handler)", capacity: 10 }
};

const accessoriesWeight = 1.2;

function byId(id) {
  return document.getElementById(id);
}

// ── Price Fetching ──
async function fetchPrices() {
  try {
    const res = await fetch("/api/uranus/prices");
    if (res.ok) {
      dbPrices = await res.json();
      updatePriceTags();
      updateConfigurator();
    }
  } catch (e) {
    console.error("Failed to load live prices", e);
  }
}

function updatePriceTags() {
  const accessories = ['flattener', 'spacers', 'guidescope', 'guidecam', 'filter', 'dewheater', 'case', 'bag', 'power', 'tripod'];
  accessories.forEach(acc => {
    const chk = byId(`chk_${acc}`);
    if (chk && dbPrices[chk.value]) {
      byId(`price_${acc}`).textContent = `$${dbPrices[chk.value].toFixed(2)}`;
    }
  });
}

// ── Core Engine ──
async function updateConfigurator() {
  const scopeId = byId("scopeSelect").value;
  const cameraId = byId("cameraSelect").value;
  const mountId = byId("mountSelect").value;
  
  const scope  = scopes[scopeId];
  const camera = cameras[cameraId];
  const mount  = mounts[mountId];

  if (!scope || !camera || !mount) return;

  // 1. Dynamic Accessory Logic
  const chkFlattener = byId("chk_flattener");
  const lblFlattener = byId("lbl_flattener");
  const descFlattener = byId("desc_flattener");
  if (chkFlattener && descFlattener) {
    if (scope.reqFlattener) {
      chkFlattener.disabled = true;
      chkFlattener.checked = true;
      descFlattener.innerHTML = 'Svbony 0.8x Field Flattener <br><small style="color: var(--accent); font-weight: 600;">(Required for 80ED)</small>';
      lblFlattener.style.opacity = '1';
    } else if (scopeId === 'none') {
      chkFlattener.disabled = false;
      descFlattener.innerHTML = 'Svbony 0.8x Field Flattener <br><small style="color: var(--muted); font-weight: 400;">(Optional)</small>';
      lblFlattener.style.opacity = '1';
    } else {
      chkFlattener.disabled = true;
      chkFlattener.checked = false;
      descFlattener.innerHTML = 'Svbony 0.8x Field Flattener <br><small style="color: var(--warn); font-weight: 600;">(Incompatible with Petzval)</small>';
      lblFlattener.style.opacity = '0.5';
    }
  }
  
  const chkSpacers = byId("chk_spacers");
  const descSpacers = byId("desc_spacers");
  if (chkSpacers && descSpacers) {
    if (scopeId !== 'none' && cameraId !== 'none') {
      chkSpacers.checked = true;
      chkSpacers.disabled = true;
      descSpacers.innerHTML = 'M42/M48 Spacer Kit <br><small style="color: var(--accent); font-weight: 600;">(Required for 55mm Backfocus)</small>';
    } else {
      chkSpacers.disabled = false;
      descSpacers.innerHTML = 'M42/M48 Spacer Kit <br><small style="color: var(--muted); font-weight: 400;">(Optional)</small>';
    }
  }

  // 2. Compatibility Math
  let payload = scope.weight + camera.weight;
  if (scopeId !== 'none' || cameraId !== 'none') payload += accessoriesWeight;

  let compatible = true;
  let payloadMsg = "N/A (Loose Parts)";
  
  if (mountId !== 'none') {
    const practicalLimit = mount.capacity * 0.5;
    if (payload > practicalLimit) {
      compatible = false;
      payloadMsg = `Overloaded (${payload.toFixed(1)}kg / ${practicalLimit}kg limit)`;
    } else {
      payloadMsg = `Within range (${payload.toFixed(1)}kg / ${practicalLimit}kg limit)`;
    }
  }

  // 3. UI Updates
  byId("scopeName").textContent   = scope.name;
  byId("cameraName").textContent  = camera.name;
  
  if (scopeId !== 'none' && cameraId !== 'none') {
    byId("adapterResult").textContent = compatible ? "Fit reviewed" : "Fit blocked";
    byId("spacerResult").textContent  = compatible ? "Locked" : "Needs review";
  } else {
    byId("adapterResult").textContent = "N/A";
    byId("spacerResult").textContent  = "N/A";
  }

  byId("payloadResult").textContent = payloadMsg;
  byId("cartResult").textContent    = compatible ? "Ready" : "Blocked";

  const status = byId("resultStatus");
  status.textContent = compatible ? "Cleared for Contact" : "Mount Blocked";
  status.className   = `result-status ${compatible ? "ok" : "bad"}`;
  
  byId("resultNote").textContent = compatible
    ? (scopeId === 'none' && cameraId === 'none' && mountId === 'none' ? "Standalone parts mode active." : "This rig passed the private compatibility checks. We show the verdict, not the recipe.")
    : "This rig did not pass the private compatibility checks. Mission Control caught it before checkout got ugly.";

  // 4. Price Calculation
  let total = 0;
  if (scopeId !== 'none' && dbPrices[scopeId]) total += dbPrices[scopeId];
  if (cameraId !== 'none' && dbPrices[cameraId]) total += dbPrices[cameraId];
  if (mountId !== 'none' && dbPrices[mountId]) total += dbPrices[mountId];

  let checkedCount = 0;
  document.querySelectorAll('.addon-chk:checked').forEach(chk => {
    if (dbPrices[chk.value]) {
      total += dbPrices[chk.value];
      checkedCount++;
    }
  });

  const rigTotal = byId("rigTotal");
  if (rigTotal) rigTotal.textContent = `$${total.toFixed(2)}`;
  
  const checkoutBtn = byId("btnCheckoutRig");
  if (checkoutBtn) {
    const hasItems = (scopeId !== 'none' || cameraId !== 'none' || mountId !== 'none' || checkedCount > 0);
    const canCheckout = compatible && hasItems;
    
    checkoutBtn.disabled = !canCheckout;
    checkoutBtn.style.opacity = canCheckout ? "1" : "0.5";
    if (!hasItems) {
      checkoutBtn.textContent = "SELECT GEAR";
    } else {
      checkoutBtn.textContent = compatible ? "SECURE YOUR RIG" : "RIG INVALID";
    }
  }
}

async function checkoutRig() {
  const checkoutBtn = byId("btnCheckoutRig");
  checkoutBtn.textContent = 'CONNECTING...';
  checkoutBtn.disabled = true;

  const items = [];
  if (byId("scopeSelect").value !== 'none') items.push(byId("scopeSelect").value);
  if (byId("cameraSelect").value !== 'none') items.push(byId("cameraSelect").value);
  if (byId("mountSelect").value !== 'none') items.push(byId("mountSelect").value);

  document.querySelectorAll('.addon-chk:checked').forEach(chk => {
    items.push(chk.value);
  });

  if (items.length === 0) {
    checkoutBtn.textContent = 'SELECT GEAR';
    return;
  }

  try {
    const res = await fetch(`/api/uranus/checkout_hardware?items=${items.join(',')}`);
    if (!res.ok) throw new Error('Checkout API failed');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    alert("Checkout failed. Mission Control is looking into it.");
    checkoutBtn.textContent = 'SECURE YOUR RIG';
    checkoutBtn.disabled = false;
  }
}

// ── Event listeners ──
if (byId("builderControls")) {
  byId("builderControls").addEventListener("change", updateConfigurator);
  byId("btnCheckoutRig").addEventListener("click", checkoutRig);
  fetchPrices();
}

// ── Legacy Handlers ──
async function checkoutHardware(itemSlug) {
  try {
    const res = await fetch(`/api/uranus/checkout_hardware?items=${itemSlug}`);
    if (!res.ok) throw new Error('Checkout API failed');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    alert("Checkout failed. Mission Control is looking into it.");
  }
}

async function checkoutUranus(tier) {
  let button;
  if (tier === 'deepprobe') {
    button = document.querySelector('#pricing .pricing-card.premium .btn');
  } else if (tier === 'fullsend') {
    button = document.querySelector('#pricing .pricing-card:nth-child(3) .btn');
  }

  const originalText = button ? button.textContent : '';
  if (button) {
    button.textContent = 'CONNECTING...';
    button.style.pointerEvents = 'none';
    button.style.opacity = '0.7';
  }

  try {
    const res = await fetch(`/api/uranus/checkout?tier=${tier}`);
    if (!res.ok) throw new Error('Checkout API failed');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    alert('Payment gateway failed. Try again soon.');
    if (button) {
      button.textContent = originalText;
      button.style.pointerEvents = 'auto';
      button.style.opacity = '1';
    }
  }
}

// ── Scroll animations ──
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));
}

// ── Smooth active nav highlighting ──
function initNavHighlighting() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".site-nav a");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.style.color = link.getAttribute("href") === `#${id}`
              ? "var(--ink)"
              : "";
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach(section => observer.observe(section));
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initNavHighlighting();
});