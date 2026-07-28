import json

with open('imported_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

engs_json = json.dumps(data['engineers'], ensure_ascii=False)
tickets_json = json.dumps(data['tickets'], ensure_ascii=False)

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 替換 defaultEngineers
start_eng = 'const defaultEngineers = ['
end_eng = '];'
s_idx = html.find(start_eng)
e_idx = html.find(end_eng, s_idx)
if s_idx != -1 and e_idx != -1:
    html = html[:s_idx] + f'const defaultEngineers = {engs_json}' + html[e_idx + len(end_eng):]

# 替換 defaultTickets
start_t = 'const defaultTickets = ['
end_t = ';\n\n                const engineers = ref([...defaultEngineers]);'
st_idx = html.find(start_t)
et_idx = html.find(end_t, st_idx)
if st_idx != -1 and et_idx != -1:
    html = html[:st_idx] + f'const defaultTickets = {tickets_json}' + html[et_idx:]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Successfully injected 434 tickets and 9 engineers into index.html!")
