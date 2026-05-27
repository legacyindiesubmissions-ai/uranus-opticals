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

function updateConfigurator() {
  const scope  = scopes[byId("scopeSelect").value];
  const camera = cameras[byId("cameraSelect").value];
  const mount  = mounts[byId("mountSelect").value];

  const spacer         = Math.max(scope.backfocus - camera.depth, 0);
  const adapter        = scope.thread === camera.thread ? "Direct thread" : `${scope.thread} → ${camera.thread}`;
  const payload        = scope.weight + camera.weight + accessoriesWeight;
  const practicalLimit = mount.capacity * 0.5;
  const compatible     = payload <= practicalLimit;
  const spacerCount    = spacer > 30 ? "2 spacer rings" : "1 spacer ring";

  // Update optical train
  byId("scopeName").textContent   = scope.name;
  byId("cameraName").textContent  = camera.name;
  byId("adapterResult").textContent = adapter;

  // Update readouts
  byId("spacerResult").textContent  = `${spacer.toFixed(1)}mm`;
  byId("payloadResult").textContent = `${payload.toFixed(1)}kg / ${mount.capacity}kg`;
  byId("cartResult").textContent    = adapter === "Direct thread"
    ? spacerCount
    : `${spacerCount} + adapter`;

  // Update status badge
  const status = byId("resultStatus");
  status.textContent = compatible ? "Cleared for Contact" : "Mount Blocked";
  status.className   = `result-status ${compatible ? "ok" : "bad"}`;

  // Update result note with custom humor
  if (!compatible) {
    byId("resultNote").textContent = `Mount blocked. Your rig is too heavy for safe entry into Uranus. The ${scope.name.split(" (")[0]} telescope and accessories exceed the payload capacity of the ${mount.name.split(" (")[0]} mount, and pretending otherwise would be embarrassing for everyone involved.`;
  } else {
    let customizedNote = `This rig has been fully cleared for Uranus. Backfocus target of ${scope.backfocus}mm is met, the payload is supported, and the setup is not lying to itself. `;
    
    if (scope.name.includes("APO") && camera.name.includes("High Penetration")) {
      customizedNote += "Warning: high-intensity pairing. This combination yields maximum deep penetration and the kind of resolution that makes amateur setups look rude.";
    } else if (mount.name.includes("GTi")) {
      customizedNote += "Note: easy entry. However, the Sky-Watcher GTi is living right at the edge of its comfort zone, so do not shake anything or start improvising.";
    } else {
      customizedNote += "Everything slides in smoothly. You are ready for a long, satisfying deep-sky exposure tonight, assuming you can keep your hands off the focus knob.";
    }
    
    byId("resultNote").textContent = customizedNote;
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
