import re

with open("index.html", "r", encoding="utf-8") as f:
    html_index = f.read()

with open("engineer.html", "r", encoding="utf-8") as f:
    html_eng = f.read()

def check_script(html, name):
    scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
    for i, s in enumerate(scripts):
        # check unescaped quotes or bad JS syntax
        print(f"{name} script {i} length: {len(s)}")

check_script(html_index, "index.html")
check_script(html_eng, "engineer.html")
