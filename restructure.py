import re
import os

# 1. READ FILES
with open('index.html', 'r') as f:
    html = f.read()
with open('app.js', 'r') as f:
    js = f.read()
with open('styles.css', 'r') as f:
    css = f.read()

# 2. EXTRACT INLINE SCRIPT FROM HTML
script_regex = re.compile(r'<script>\s*// Tweaks panel toggle.*?</script>', re.DOTALL)
match = script_regex.search(html)
if match:
    inline_script = match.group(0).replace('<script>', '').replace('</script>', '').strip()
    html = html.replace(match.group(0), '')
else:
    inline_script = ""

# 3. EXTRACT INLINE STYLE FROM HTML
style_regex = re.compile(r'<style>.*?</style>', re.DOTALL)
match = style_regex.search(html)
if match:
    inline_style = match.group(0).replace('<style>', '').replace('</style>', '').strip()
    html = html.replace(match.group(0), '')
else:
    inline_style = ""

# 4. REWRITE APP.JS
new_js = f"""/* ═══════════════════════════════════════════
   URANUS OPTICALS — Mission Ready-Sourced Deep Scope Engine
   "We've seen the backside of every telescope."
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {{

{js.replace('/* ═══════════════════════════════════════════\n   URANUS OPTICALS — Mission Ready-Sourced Deep Scope Engine\n   "We\'ve seen the backside of every telescope."\n   ═══════════════════════════════════════════ */\n', '')}

// ── INLINE SCRIPTS MOVED FROM HTML ──
{inline_script}

// ── EXPOSE TO WINDOW FOR INLINE HTML HANDLERS ──
window.setJokeIntensity = typeof setJokeIntensity !== 'undefined' ? setJokeIntensity : null;
window.setTheme = typeof setTheme !== 'undefined' ? setTheme : null;
window.toggleCart = typeof toggleCart !== 'undefined' ? toggleCart : null;
window.updateCartQty = typeof updateCartQty !== 'undefined' ? updateCartQty : null;
window.removeFromCart = typeof removeFromCart !== 'undefined' ? removeFromCart : null;
window.checkoutCart = typeof checkoutCart !== 'undefined' ? checkoutCart : null;
window.clearCart = typeof clearCart !== 'undefined' ? clearCart : null;
window.startSimulation = typeof startSimulation !== 'undefined' ? startSimulation : null;
window.checkoutRig = typeof checkoutRig !== 'undefined' ? checkoutRig : null;

}});
"""

# 5. REWRITE INDEX.HTML
# Wrap sections in <main>
html = html.replace('</section>\n\n<section id="configurator">', '</section>\n<main>\n<section id="configurator" aria-labelledby="configurator-title">')
html = html.replace('</section>\n<!-- FOOTER -->', '</section>\n</main>\n<!-- FOOTER -->')

# Remove defer from app.js since we wrap in DOMContentLoaded (optional, but clean)
# html = html.replace('<script src="app.js?v=2.0.2" defer></script>', '<script src="app.js?v=2.0.2"></script>')

# 6. REWRITE STYLES.CSS
new_css = f"""/* ── DESIGN TOKENS & BASE (Moved from HTML) ── */
{inline_style}

/* ── MAIN STYLES ── */
{css}
"""

with open('index.html', 'w') as f:
    f.write(html)
with open('app.js', 'w') as f:
    f.write(new_js)
with open('styles.css', 'w') as f:
    f.write(new_css)

print("Restructure complete!")
