import json, re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

m = re.search(r'const defaultTickets = (\[.*?\]);', html, re.DOTALL)
if m:
    raw_js = m.group(1)
    tickets = json.loads(raw_js)

    headers = ['編號', '報修日期', '完成日期', '當前狀態', '報價進度', '歸檔狀態', '負責工程師', '客戶名稱', '機型', '時效(天)', '聯絡人', '電話', '地址', '保固', '問題狀況', '其他詳細資訊']

    def escapeCSV(val):
        # Clean newlines inside val to keep each record strictly on a single line for Excel compatibility
        s = str(val if val is not None else "").replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ')
        s = s.replace('"', '""')
        return f'"{s}"'

    rows = []
    for t in tickets:
        details_str = t.get('details', '')
        first_line = details_str.strip().split('\n')[0].strip() if details_str else ''
        issue_text = t.get('issue') or first_line
        row = [
            escapeCSV(t.get('id')),
            escapeCSV(t.get('reportTime')),
            escapeCSV(t.get('completedDate', '')),
            escapeCSV(t.get('status')),
            escapeCSV(t.get('quoteState', '')),
            escapeCSV('已封存' if t.get('isArchived') else '處理中'),
            escapeCSV(t.get('engineer')),
            escapeCSV(t.get('customer')),
            escapeCSV(t.get('model')),
            escapeCSV(t.get('slaDays')),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(issue_text),
            escapeCSV(details_str)
        ]
        rows.append(",".join(row))

    csv_content = "\ufeff" + ",".join([escapeCSV(h) for h in headers]) + "\r\n" + "\r\n".join(rows)
    with open("scratch/clean_output.csv", "w", encoding="utf-8-sig") as out:
        out.write(csv_content)

    print("Clean CSV generated successfully! Total rows:", len(rows))
