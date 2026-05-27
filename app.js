/* ═══════════════════════════════════════════
   URANUS OPTICALS — Compatibility Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

const scopes = {
  sv503:  { name: "Svbony SV503 80ED (Beginner Probe)",         backfocus: 55, thread: "M48", weight: 2.7 },
  fra300: { name: "Askar FRA300 Pro (The Deep Explorer)",       backfocus: 55, thread: "M48", weight: 2.9 },
  kuo80:  { name: "Uranus Signature 80 APO (Full Insertion)",   backfocus: 55, thread: "M54", weight: 3.2 }
};

const cameras = {
  sv605:      { name: "Svbony SV605CC (Cooled Deep Sensor)",        depth: 17.5, thread: "M42", weight: 0.42 },
  poseidon:   { name: "Player One Poseidon-C (Direct Core)",        depth: 17.5, thread: "M42", weight: 0.68 },
  touptek533: { name: "Uranus Signature 533C (High Penetration)", depth: 17.5, thread: "M42", weight: 0.72 }
};

const mounts = {
  gti:     { name: "Sky-Watcher GTi (Light duty)",      capacity: 5  },
  am3n:    { name: "ZWO AM3N (Medium load)",            capacity: 8  },
  juwei17: { name: "Uranus Harmonic 17 (Heavy handler)", capacity: 10 }
};

const accessoriesWeight = 1.2;

function byId(id) {
  return document.getElementById(id);
}

async function updateConfigurator() {
  const scopeId = byId("scopeSelect").value;
  const cameraId = byId("cameraSelect").value;
  const mountId = byId("mountSelect").value;

  try {
    const res = await fetch(`/api/uranus/configure?scope=${scopeId}&camera=${cameraId}&mount=${mountId}`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();

    // Update optical train
    byId("scopeName").textContent = data.scopeName;
    byId("cameraName").textContent = data.cameraName;
    byId("adapterResult").textContent = data.compatible ? "Fit reviewed" : "Fit blocked";

    // Keep public readouts outcome-level; the detailed recipe belongs server-side.
    byId("spacerResult").textContent = data.compatible ? "Locked" : "Needs review";
    byId("payloadResult").textContent = data.compatible ? "Within range" : "Upgrade required";
    byId("cartResult").textContent = data.compatible ? "Ready" : "Blocked";

    // Update status badge
    const status = byId("resultStatus");
    status.textContent = data.status;
    status.className = `result-status ${data.compatible ? "ok" : "bad"}`;

    // Update result note
    byId("resultNote").textContent = data.publicNote || (
      data.compatible
        ? "This rig passed the private compatibility checks. We show the verdict, not the recipe."
        : "This rig did not pass the private compatibility checks. Mission Control caught it before checkout got ugly."
    );
  } catch {
    // Fallback local calculations in case backend is offline
    const scope  = scopes[scopeId];
    const camera = cameras[cameraId];
    const mount  = mounts[mountId];

    const payload        = scope.weight + camera.weight + accessoriesWeight;
    const practicalLimit = mount.capacity * 0.5;
    const compatible     = payload <= practicalLimit;

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
  }
}

// ── Event listeners ──
["scopeSelect", "cameraSelect", "mountSelect"].forEach(id => {
  byId(id).addEventListener("change", updateConfigurator);
});

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

// ── Init ──
updateConfigurator();
initScrollAnimations();
initNavHighlighting();
