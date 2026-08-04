import re, subprocess

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
if m:
    js_code = m.group(1)
    with open("scratch/temp_index.js", "w", encoding="utf-8") as out:
        out.write("const Vue = { createApp: () => ({ mount: () => {} }), ref: v=>v, reactive: v=>v, computed: fn=>fn, onMounted: fn=>fn };\n" + js_code)

with open("engineer.html", "r", encoding="utf-8") as f:
    html_eng = f.read()

m_eng = re.search(r'<script>(.*?)</script>', html_eng, re.DOTALL)
if m_eng:
    js_code_eng = m_eng.group(1)
    with open("scratch/temp_eng.js", "w", encoding="utf-8") as out:
        out.write("const Vue = { createApp: () => ({ mount: () => {} }), ref: v=>v, reactive: v=>v, computed: fn=>fn, onMounted: fn=>fn };\n" + js_code_eng)

res1 = subprocess.run(["node", "--check", "scratch/temp_index.js"], capture_output=True, text=True)
print("index.js syntax check:", res1.returncode, res1.stderr)

res2 = subprocess.run(["node", "--check", "scratch/temp_eng.js"], capture_output=True, text=True)
print("eng.js syntax check:", res2.returncode, res2.stderr)
