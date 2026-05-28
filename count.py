import re
from bs4 import BeautifulSoup

def count_jokes(file_path):
    with open(file_path, 'r') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')
    for script in soup(["script", "style"]):
        script.extract()
    text = soup.body.get_text() if soup.body else ""
    matches = re.findall(r'Uranus', text, re.IGNORECASE)
    return len(matches)

total = sum(count_jokes(f) for f in ['index.html', 'loose-debris.html', 'community.html'])
print(f"Total Uranus references in visible text: {total}")
