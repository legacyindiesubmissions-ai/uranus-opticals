/* ═══════════════════════════════════════════
   URANUS OPTICALS — Deep Scope Bundle Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

let dbPrices = {};

const scopes = {
  glancer:    { name: "Svbony SV503 80ED (Beginner Probe)",         backfocus: 55, thread: "M48", weight: 2.7, reqFlattener: true },
  penetrator: { name: "Askar FRA300 Pro (The Deep Explorer)",       backfocus: 55, thread: "M48", weight: 2.9, reqFlattener: false },
  panoramic:  { name: "Uranus Signature 80 APO (Full Insertion)",   backfocus: 55, thread: "M54", weight: 3.2, reqFlattener: false }
};

const cameras = {
  snapshot533:   { name: "Svbony SV605CC (Cooled Deep Sensor)",        depth: 17.5, thread: "M42", weight: 0.42 },
  deepgaze571:   { name: "Player One Poseidon-C (Direct Core)",        depth: 17.5, thread: "M42", weight: 0.68 },
  omnivision455: { name: "Uranus Signature 533C (High Penetration)", depth: 17.5, thread: "M42", weight: 0.72 }
};

const mounts = {
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

  // Auto-inject logic
  const chkFlattener = byId("chk_flattener");
  if (chkFlattener) {
    if (scope.reqFlattener) {
      chkFlattener.checked = true;
      chkFlattener.disabled = true; // Force it on
    } else {
      chkFlattener.disabled = false;
    }
  }
  
  // Backfocus spacers are always required for these dedicated astro setups
  const chkSpacers = byId("chk_spacers");
  if (chkSpacers) {
    chkSpacers.checked = true;
    chkSpacers.disabled = true;
  }

  // Compatibility Math
  const payload        = scope.weight + camera.weight + accessoriesWeight;
  const practicalLimit = mount.capacity * 0.5;
  const compatible     = payload <= practicalLimit;

  // UI Updates
  byId("scopeName").textContent   = scope.name;
  byId("cameraName").textContent  = camera.name;
  byId("adapterResult").textContent = compatible ? "Fit reviewed" : "Fit blocked";
  byId("spacerResult").textContent  = compatible ? "Locked" : "Needs review";
  byId("payloadResult").textContent = compatible ? "Within range" : "Upgrade required";
  byId("cartResult").textContent    = compatible ? "Ready" : "Blocked";

  const status = byId("resultStatus");
  status.textContent = compatible ? "Cleared for Contact" : "Mount Blocked";
  status.className   = `result-status ${compatible ? "ok" : "bad"}`;
  byId("resultNote").textContent = compatible
    ? "This rig passed the private compatibility checks. We show the verdict, not the recipe."
    : "This rig did not pass the private compatibility checks. Mission Control caught it before checkout got ugly.";

  // Price Calculation
  let total = 0;
  if (dbPrices[scopeId]) total += dbPrices[scopeId];
  if (dbPrices[cameraId]) total += dbPrices[cameraId];
  if (dbPrices[mountId]) total += dbPrices[mountId];

  document.querySelectorAll('.addon-chk:checked').forEach(chk => {
    if (dbPrices[chk.value]) total += dbPrices[chk.value];
  });

  const rigTotal = byId("rigTotal");
  if (rigTotal) rigTotal.textContent = `$${total.toFixed(2)}`;
  
  const checkoutBtn = byId("btnCheckoutRig");
  if (checkoutBtn) {
    checkoutBtn.disabled = !compatible;
    checkoutBtn.style.opacity = compatible ? "1" : "0.5";
    checkoutBtn.textContent = compatible ? "SECURE YOUR RIG" : "RIG INVALID";
  }
}

async function checkoutRig() {
  const checkoutBtn = byId("btnCheckoutRig");
  checkoutBtn.textContent = 'CONNECTING...';
  checkoutBtn.disabled = true;

  const items = [
    byId("scopeSelect").value,
    byId("cameraSelect").value,
    byId("mountSelect").value
  ];

  document.querySelectorAll('.addon-chk:checked').forEach(chk => {
    items.push(chk.value);
  });

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