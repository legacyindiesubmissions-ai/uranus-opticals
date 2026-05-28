import re

with open('index.html', 'r') as f:
    html = f.read()

# Section 1: The Hole
html = html.replace('<section id="problem">\n  <div class="container">', '<section id="problem">\n  <div class="container">\n    <div class="section-card">')
html = html.replace('    </div>\n  </div>\n</section>\n\n<!-- TESTIMONIALS -->', '    </div>\n    </div>\n  </div>\n</section>\n\n<!-- TESTIMONIALS -->')

# Section 2: Testimonials
html = html.replace('<!-- TESTIMONIALS -->\n<section>\n  <div class="container">', '<!-- TESTIMONIALS -->\n<section>\n  <div class="container">\n    <div class="section-card">')
html = html.replace('    </div>\n  </div>\n</section>\n\n<!-- PRICING -->', '    </div>\n    </div>\n  </div>\n</section>\n\n<!-- PRICING -->')

# Section 3: Pricing
html = html.replace('<!-- PRICING -->\n<section id="pricing">\n  <div class="container">', '<!-- PRICING -->\n<section id="pricing">\n  <div class="container">\n    <div class="section-card">')

# Extract COMMIT TO URANUS button
btn_code = '        <a href="https://buy.stripe.com/7sY6oH2868Fa3Zw1kqaR209" class="btn btn-primary" style="width:100%;text-align:center">COMMIT TO URANUS</a>\n'
if btn_code in html:
    html = html.replace(btn_code, '')
    
    # Insert button below pricing-grid
    pricing_grid_end = '      </div>\n    </div>\n  </div>\n</section>'
    new_btn_placement = f"""      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <a href="https://buy.stripe.com/7sY6oH2868Fa3Zw1kqaR209" class="btn btn-primary" style="font-size: 1.2rem; padding: 18px 48px;">COMMIT TO URANUS</a>
      </div>

    </div>
  </div>
</section>"""
    html = html.replace(pricing_grid_end, new_btn_placement)

with open('index.html', 'w') as f:
    f.write(html)

print("Done wrapping index.html")
