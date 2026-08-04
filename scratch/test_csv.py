import json, re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extract defaultTickets
m = re.search(r'const defaultTickets = (\[.*?\])', html, re.DOTALL)
if m:
    tickets = json.loads(m.group(1))
    print("Found tickets:", len(tickets))
    
    def parseDetails(details):
        if not details: return {"contact":"", "phone":"", "address":"", "warranty":"", "issue":""}
        def extract(text, reg):
            match = re.search(reg, text)
            return match.group(1).strip().replace(',', '，') if match else ""
        issue = extract(details, r'(?:故障問題|故障原因|故障|固障|問題|原因)[：:\s]*([^\n]+)')
        if not issue and details.strip():
            issue = details.strip().split('\n')[0].trim() if hasattr(details.strip().split('\n')[0], 'trim') else details.strip().split('\n')[0].strip()
        return {
            "contact": extract(details, r'(?:聯絡人|聯絡|姓名)[：:\s]*([^\n]+)'),
            "phone": extract(details, r'(?:電話|手機|聯絡方式)[：:\s]*([^\n]+)'),
            "address": extract(details, r'(?:地址|地點)[：:\s]*([^\n]+)'),
            "warranty": extract(details, r'(?:保固狀態|保固)[：:\s]*([^\n]+)'),
            "issue": issue
        }

    headers = ['編號', '報修日期', '完成日期', '當前狀態', '報價進度', '歸檔狀態', '負責工程師', '客戶名稱', '機型', '時效(天)', '聯絡人', '電話', '地址', '保固', '問題狀況', '其他詳細資訊']
    
    def escapeCSV(val):
        return f'"{str(val if val is not None else "").replace('"', '""')}"'

    rows = []
    for t in tickets:
        p = parseDetails(t.get('details', ''))
        issueText = t.get('issue') or p.get('issue') or (t.get('details', '').split('\n')[0].strip() if t.get('details') else '')
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
            escapeCSV(p.get('contact')),
            escapeCSV(p.get('phone')),
            escapeCSV(p.get('address')),
            escapeCSV(p.get('warranty')),
            escapeCSV(issueText),
            escapeCSV(t.get('details'))
        ]
        rows.append(",".join(row))

    csv_content = "\ufeff" + ",".join([escapeCSV(h) for h in headers]) + "\n" + "\n".join(rows)
    with open("scratch/sample_output.csv", "w", encoding="utf-8-sig") as out:
        out.write(csv_content)
    print("CSV written to scratch/sample_output.csv, lines:", len(rows))
