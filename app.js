/* ═══════════════════════════════════════════
   URANUS OPTICALS — Deep Scope Bundle Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

let dbPrices = {};

const scopes = {
  none:       { name: "None / Have my own",                         backfocus: 0,  thread: "N/A", weight: 0,   reqFlattener: false },
  glancer:    { name: "Svbony SV503 80ED (Beginner Probe)",         backfocus: 55, thread: "M48", weight: 2.7, reqFlattener: true },
  penetrator: { name: "Askar FRA300 Pro (The Deep Explorer)",       backfocus: 55, thread: "M48", weight: 2.9, reqFlattener: false },
  panoramic:  { name: "Uranus Signature 80 APO (Full Insertion)",   backfocus: 55, thread: "M54", weight: 4.1, reqFlattener: false } // Fixed weight to 4.1kg for FRA500 eq
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
  hm17:       { name: "Uranus Harmonic 17 (Heavy handler)", capacity: 15 } // Fixed from 10kg to 15kg for AM5 equivalent
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
    }
  } catch (e) {
    console.error("Failed to load live prices", e);
  } finally {
    updatePriceTags();
    updateConfigurator();
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
  const accList = [
    { id: 'flattener' },
    { id: 'spacers' },
    { id: 'guidescope' },
    { id: 'guidecam' },
    { id: 'filter' },
    { id: 'dewheater' },
    { id: 'case' },
    { id: 'bag' },
    { id: 'power' },
    { id: 'tripod' }
  ];

  accList.forEach(item => {
    const chk = byId(`chk_${item.id}`);
    const lbl = byId(`lbl_${item.id}`);
    const desc = byId(`desc_${item.id}`);
    if (!chk || !lbl || !desc) return;

    let show = true;
    let forceCheck = false;
    let note = '';

    // Flattener Rules
    if (item.id === 'flattener') {
      if (scopeId === 'glancer') { 
        show = true; forceCheck = true; note = '(Required for 80ED Doublet)'; 
      }
      else if (scopeId === 'none') { 
        show = true; note = '(Optional)'; 
      }
      else { 
        show = false; // Completely hide for Petzval (FRA300/FRA500)
      }
    }
    // Case Rules: Glancer (470mm) and Panoramic (410mm) REQUIRE the 55cm Hard Case.
    // Penetrator (303mm) fits it but it's overkill.
    else if (item.id === 'case') {
      show = true; // Hard case fits everything in our catalog
      if (scopeId === 'penetrator') note = '(Optional - Padded Bag preferred)';
    }
    // Bag Rules: ONLY fits the Penetrator (303mm). Glancer (470mm) and Panoramic (410mm) are too long.
    else if (item.id === 'bag') {
      if (scopeId === 'penetrator' || scopeId === 'none') {
        show = true;
        note = scopeId === 'penetrator' ? '(Perfect fit for FRA300)' : '(Optional)';
      } else {
        show = false; // Hide for scopes > 400mm
      }
    }
    // Spacer Rules
    else if (item.id === 'spacers') {
      if (scopeId !== 'none' && cameraId !== 'none') { 
        show = true; forceCheck = true; note = '(Required for Backfocus)'; 
      }
      else { 
        show = true; note = '(Optional)'; 
      }
    }

    if (!show) {
      lbl.style.display = 'none';
      chk.checked = false;
    } else {
      lbl.style.display = 'flex';
      chk.disabled = forceCheck;
      if (forceCheck) chk.checked = true;
      
      const baseText = desc.innerHTML.split('<br>')[0].trim();
      if (note) {
        const color = forceCheck ? 'var(--accent)' : 'var(--muted)';
        const weight = forceCheck ? '600' : '400';
        desc.innerHTML = `${baseText} <br><small style="color: ${color}; font-weight: ${weight};">${note}</small>`;
      } else {
        desc.innerHTML = baseText;
      }
    }
  });

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
    const spacerRequired = scope.backfocus - camera.depth;
    const adapterType = scope.thread === camera.thread ? `Direct ${scope.thread}` : `${scope.thread} to ${camera.thread} adapter`;
    
    byId("adapterResult").textContent = adapterType;
    byId("spacerResult").textContent  = `${spacerRequired.toFixed(1)}mm Spacer required`;
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
  updateConfigurator();
});