import re
import glob

def clean_and_inject(file_path):
    with open(file_path, 'r') as f:
        html = f.read()

    # 1. Remove old tweaks panel
    panel_regex = re.compile(r'<button class="tweaks-toggle"[^>]*>.*?</button>\s*<div class="tweaks-panel"[^>]*>.*?</div>', re.DOTALL)
    html = panel_regex.sub('', html)
    
    # 2. Inject nav toggles
    nav_toggles = """    <div style="display: flex; gap: 12px; align-items: center;">
      <button class="nav-tweak-btn" id="navThemeToggle" title="Toggle Theme (Deep Space / Gas Giant)" onclick="cycleTheme()" aria-label="Toggle Theme">🌑</button>
      <button class="nav-tweak-btn" id="navJokeToggle" title="Nuclear Option (Apocalyptic Jokes)" onclick="cycleJokeIntensity()" aria-label="Toggle Jokes">☢️</button>"""
      
    # Replace </ul>\n    <a href=... with </ul>\n    <div style...>\n      <a href=... \n    </div>
    # Note: community.html might not have nav-cta
    if '<a href="#configurator" class="nav-cta">PROBE NOW</a>' in html:
        html = html.replace(
            '</ul>\n    <a href="#configurator" class="nav-cta">PROBE NOW</a>',
            '</ul>\n' + nav_toggles + '\n      <a href="#configurator" class="nav-cta">PROBE NOW</a>\n    </div>'
        )
    elif '</ul>\n    <a href="index.html#configurator" class="nav-cta">PROBE NOW</a>' in html:
        html = html.replace(
            '</ul>\n    <a href="index.html#configurator" class="nav-cta">PROBE NOW</a>',
            '</ul>\n' + nav_toggles + '\n      <a href="index.html#configurator" class="nav-cta">PROBE NOW</a>\n    </div>'
        )
    elif '</ul>' in html and 'nav-cta' not in html[html.find('</ul>'):html.find('</nav>')]:
        # If no nav-cta exists right after ul
        html = html.replace(
            '</ul>\n  </div>\n</nav>',
            '</ul>\n' + nav_toggles + '\n    </div>\n  </div>\n</nav>'
        )
        
    with open(file_path, 'w') as f:
        f.write(html)

for f in glob.glob('*.html'):
    clean_and_inject(f)

print("Done tweaking HTML UIs")
