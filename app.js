/* ═══════════════════════════════════════════
   URANUS OPTICALS — Alibaba-Sourced Deep Scope Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

let dbPrices = {};

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

  const scope  = scopes[scopeId];
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
        if (cFR > 0) {
            show = true;
            note = (cFR >= 6) ? '(Highly Recommended for f/' + cFR + ')' : '(Optional)';
        } else {
            show = true; note = '(Optional for Refractors)';
        }
      }
      else { show = false; }
    }
    // Bag Rules (Small = 40cm, Large = 65cm)
    else if (id === 'bag') {
      if (effectiveLen > 0 && effectiveLen <= 380) { show = true; note = '(Perfect Fit)'; }
      else if (scopeId === 'none' && effectiveLen === 0) { show = true; note = '(Fits < 40cm)'; }
      else { show = false; }
    }
    else if (id === 'bag_lg') {
      if (effectiveLen > 380 && effectiveLen <= 620) { show = true; note = '(Confirmed Fit)'; }
      else if (scopeId === 'none' && effectiveLen === 0) { show = true; note = '(Fits < 65cm)'; }
      else { show = false; }
    }
    // Case Rules (Small = 55cm, XL = 60cm+)
    else if (id === 'case') {
      if (effectiveLen > 0 && effectiveLen <= 520) { show = true; note = '(Hard Shell Protection)'; }
      else if (scopeId === 'none' && effectiveLen === 0) { show = true; note = '(Fits < 55cm)'; }
      else { show = false; }
    }
    else if (id === 'case_xl') {
      if (effectiveLen > 520 || (scopeId === 'glancer' || scopeId === 'panoramic')) { show = true; note = '(Maximum Protection)'; }
      else if (scopeId === 'none' && effectiveLen === 0) { show = true; note = '(Fits < 65cm)'; }
      else { show = false; }
    }
    // Spacer Rules
    else if (id === 'spacers') {
      if (scopeId !== 'none' && cameraId !== 'none') { show = true; forceCheck = true; note = '(Required for Backfocus)'; }
      else { show = true; note = '(Recommended for focus)'; }
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
  byId("scopeName").textContent   = (scopeId === 'none' && cLen > 0) ? `Custom Scope (${cLen}mm)` : scope.name;
  byId("cameraName").textContent  = camera.name;
  
  if (scopeId !== 'none' && cameraId !== 'none') {
    const spacerRequired = scope.backfocus - camera.depth;
    const adapterType = scope.thread === camera.thread ? `Direct ${scope.thread}` : `${scope.thread} to ${camera.thread} adapter`;
    
    byId("adapterResult").textContent = adapterType;
    byId("spacerResult").textContent  = `${spacerRequired.toFixed(1)}mm Spacer required`;
  } else {
    byId("adapterResult").textContent = "N/A";
    byId("spacerResult").textContent  = (scopeId === 'none' && cLen > 0) ? "Review Specs" : "N/A";
  }

  byId("payloadResult").textContent = payloadMsg;
  byId("cartResult").textContent    = compatible ? "Ready" : "Blocked";

  const status = byId("resultStatus");
  status.textContent = compatible ? "Cleared for Contact" : "Mount Blocked";
  status.className   = `result-status ${compatible ? "ok" : "bad"}`;
  
  byId("resultNote").textContent = compatible
    ? (scopeId === 'none' ? "Smart Recommendations active for your custom scope." : "This rig passed the private compatibility checks. We show the verdict, not the recipe.")
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
    checkoutBtn.disabled = false;
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
  byId("customScopeLen").addEventListener("input", updateConfigurator);
  byId("customScopeFR").addEventListener("input", updateConfigurator);
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
