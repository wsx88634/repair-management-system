import json, re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extract defaultTickets
m = re.search(r'const defaultTickets = (\[.*?\]);', html, re.DOTALL)
if m:
    print("Found defaultTickets match")
    # let's parse JS object manually or replace quotes
    raw_js = m.group(1)
    # count items
    tickets = json.loads(raw_js)
    print("Parsed tickets count:", len(tickets))
    
    # Check details of first ticket
    t0 = tickets[0]
    print("t0 customer:", t0['customer'])
    print("t0 details repr:", repr(t0['details']))
