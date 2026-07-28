/**
 * 叫修輔助管理系統 - 前端邏輯控制器 (app.js)
 */

// 預設 Mock 本地示範資料
const DEFAULT_MOCK_TICKETS = [
  {
    id: "REP-982301",
    createdAt: "2026-07-28 14:20:00",
    reporter: "王大明",
    phone: "0912-345-678",
    location: "4F 資訊處",
    category: "電腦資訊",
    device: "Dell 工作站 #04",
    description: "開機後螢幕無訊號，主機風扇運轉異常大聲，推測可能為顯卡或電源供應器故障。",
    priority: "高",
    status: "待處理",
    note: "",
    updatedAt: "2026-07-28 14:20:00"
  },
  {
    id: "REP-982302",
    createdAt: "2026-07-28 11:05:12",
    reporter: "李美玲",
    phone: "0922-888-999",
    location: "2F 總務部",
    category: "水電空調",
    device: "大金中央空調",
    description: "會議室 A 空調吹出異味且溫度下降緩慢，顯示器閃爍 E4 錯誤代碼。",
    priority: "中",
    status: "處理中",
    note: "已聯繫原廠維修技師，預計明日下午到場檢修。",
    updatedAt: "2026-07-28 15:10:00"
  },
  {
    id: "REP-982303",
    createdAt: "2026-07-27 09:30:00",
    reporter: "陳主任",
    phone: "0933-111-222",
    location: "1F 門廳服務台",
    category: "辦公設備",
    device: "Epson 多功能印表機",
    description: "影印時紙張頻繁卡在二號進紙槽，碳粉警報燈恆亮。",
    priority: "低",
    status: "已完成",
    note: "已更換進紙滾輪並補滿碳粉，測試影印正常完工。",
    updatedAt: "2026-07-27 16:45:00"
  }
];

// 全域狀態管理
let state = {
  apiUrl: localStorage.getItem("gas_repair_api_url") || "",
  tickets: [],
  filterCategory: "ALL",
  filterStatus: "ALL",
  searchQuery: "",
  isLoading: false
};

// DOM 元素引用
const DOM = {
  apiStatusBadge: document.getElementById("apiStatusBadge"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  
  statTotal: document.getElementById("statTotal"),
  statPending: document.getElementById("statPending"),
  statProgress: document.getElementById("statProgress"),
  statCompleted: document.getElementById("statCompleted"),

  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter"),
  refreshBtn: document.getElementById("refreshBtn"),
  ticketGrid: document.getElementById("ticketGrid"),

  // Modal 報修
  openCreateModalBtn: document.getElementById("openCreateModalBtn"),
  createModal: document.getElementById("createModal"),
  closeCreateModalBtn: document.getElementById("closeCreateModalBtn"),
  cancelCreateBtn: document.getElementById("cancelCreateBtn"),
  createTicketForm: document.getElementById("createTicketForm"),

  // Modal 設定
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsModalBtn: document.getElementById("closeSettingsModalBtn"),
  apiUrlInput: document.getElementById("apiUrlInput"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  clearSettingsBtn: document.getElementById("clearSettingsBtn")
};

// 初始化應用
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  initData();
});

// 註冊事件監聽
function initEventListeners() {
  // Modal 切換
  DOM.openCreateModalBtn.addEventListener("click", () => openModal(DOM.createModal));
  DOM.closeCreateModalBtn.addEventListener("click", () => closeModal(DOM.createModal));
  DOM.cancelCreateBtn.addEventListener("click", () => closeModal(DOM.createModal));

  DOM.openSettingsBtn.addEventListener("click", () => {
    DOM.apiUrlInput.value = state.apiUrl;
    openModal(DOM.settingsModal);
  });
  DOM.closeSettingsModalBtn.addEventListener("click", () => closeModal(DOM.settingsModal));

  // 儲存與清空設定
  DOM.saveSettingsBtn.addEventListener("click", saveApiSettings);
  DOM.clearSettingsBtn.addEventListener("click", clearApiSettings);

  // 提交報修單
  DOM.createTicketForm.addEventListener("submit", handleCreateTicket);

  // 重新同步
  DOM.refreshBtn.addEventListener("click", loadData);

  // 搜尋與篩選
  DOM.searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderTickets();
  });
  DOM.categoryFilter.addEventListener("change", (e) => {
    state.filterCategory = e.target.value;
    renderTickets();
  });
  DOM.statusFilter.addEventListener("change", (e) => {
    state.filterStatus = e.target.value;
    renderTickets();
  });
}

// 初始化載入資料
async function initData() {
  updateApiStatusUI();
  await loadData();
}

// 載入叫修資料 (API 或 Mock)
async function loadData() {
  setLoading(true);
  if (!state.apiUrl) {
    // 採用 Mock 模式
    const local = localStorage.getItem("local_mock_tickets");
    if (local) {
      try { state.tickets = JSON.parse(local); } catch(e) { state.tickets = DEFAULT_MOCK_TICKETS; }
    } else {
      state.tickets = [...DEFAULT_MOCK_TICKETS];
      saveLocalMockTickets();
    }
    updateApiStatusUI();
    renderAll();
    setLoading(false);
    return;
  }

  // 採用 GAS API 真實同步
  try {
    const url = `${state.apiUrl}?action=list&t=${new Date().getTime()}`;
    const res = await fetch(url);
    const result = await res.json();

    if (result.status === "success") {
      state.tickets = result.data || [];
      updateApiStatusUI(true);
    } else {
      alert("API 連線失敗：" + (result.message || "未知錯誤"));
      updateApiStatusUI(false, "API 錯誤");
    }
  } catch (err) {
    console.error("Fetch GAS error:", err);
    updateApiStatusUI(false, "連線失敗 (請檢查網址)");
  } finally {
    renderAll();
    setLoading(false);
  }
}

// 新增叫修單
async function handleCreateTicket(e) {
  e.preventDefault();
  const reporter = document.getElementById("reporterInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const location = document.getElementById("locationInput").value.trim();
  const category = document.getElementById("categorySelect").value;
  const device = document.getElementById("deviceInput").value.trim();
  const priority = document.getElementById("prioritySelect").value;
  const description = document.getElementById("descriptionInput").value.trim();

  const newPayload = {
    action: "create",
    reporter,
    phone,
    location,
    category,
    device,
    priority,
    description
  };

  setLoading(true);

  if (!state.apiUrl) {
    // 本地 Mock 新增
    const nowStr = formatDate(new Date());
    const mockId = "REP-" + Math.floor(100000 + Math.random() * 900000);
    const newTicket = {
      id: mockId,
      createdAt: nowStr,
      ...newPayload,
      status: "待處理",
      note: "",
      updatedAt: nowStr
    };
    state.tickets.unshift(newTicket);
    saveLocalMockTickets();
    closeModal(DOM.createModal);
    DOM.createTicketForm.reset();
    renderAll();
    setLoading(false);
    alert(`🎉 叫修單據新增成功！單號：${mockId}`);
    return;
  }

  // 真實 API 提交
  try {
    const res = await fetch(state.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(newPayload)
    });
    const result = await res.json();
    if (result.status === "success") {
      alert(`🎉 叫修單據新增成功！單號：${result.ticket.id}`);
      closeModal(DOM.createModal);
      DOM.createTicketForm.reset();
      await loadData();
    } else {
      alert("新增失敗：" + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("發送單據至 Apps Script 時發生網路錯誤");
  } finally {
    setLoading(false);
  }
}

// 更新單據狀態
async function updateTicketStatus(id, newStatus) {
  setLoading(true);

  if (!state.apiUrl) {
    const ticket = state.tickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = newStatus;
      ticket.updatedAt = formatDate(new Date());
      saveLocalMockTickets();
      renderAll();
    }
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(state.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "update", id: id, status: newStatus })
    });
    const result = await res.json();
    if (result.status === "success") {
      await loadData();
    } else {
      alert("狀態更新失敗：" + result.message);
      await loadData();
    }
  } catch (err) {
    console.error(err);
    alert("更新狀態時發生連線錯誤");
  } finally {
    setLoading(false);
  }
}

// 畫面渲染：指標 + 列表
function renderAll() {
  renderStats();
  renderTickets();
}

// 渲染統計指標
function renderStats() {
  const total = state.tickets.length;
  const pending = state.tickets.filter(t => t.status === "待處理").length;
  const progress = state.tickets.filter(t => t.status === "處理中").length;
  const completed = state.tickets.filter(t => t.status === "已完成").length;

  DOM.statTotal.textContent = total;
  DOM.statPending.textContent = pending;
  DOM.statProgress.textContent = progress;
  DOM.statCompleted.textContent = completed;
}

// 渲染單據卡片
function renderTickets() {
  let filtered = state.tickets.filter(t => {
    // 分類過濾
    if (state.filterCategory !== "ALL" && t.category !== state.filterCategory) return false;
    // 狀態過濾
    if (state.filterStatus !== "ALL" && t.status !== state.filterStatus) return false;
    // 關鍵字搜尋
    if (state.searchQuery) {
      const q = state.searchQuery;
      const matchId = t.id.toLowerCase().includes(q);
      const matchReporter = t.reporter.toLowerCase().includes(q);
      const matchDevice = (t.device || "").toLowerCase().includes(q);
      const matchLocation = (t.location || "").toLowerCase().includes(q);
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      if (!matchId && !matchReporter && !matchDevice && !matchLocation && !matchDesc) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    DOM.ticketGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <h3>查無符合條件的叫修單據</h3>
        <p style="font-size: 0.9rem; margin-top: 6px;">請嘗試更換搜尋關鍵字或點擊右上角「我要報修」新增單據。</p>
      </div>
    `;
    return;
  }

  DOM.ticketGrid.innerHTML = filtered.map(t => `
    <div class="ticket-card" data-status="${t.status}">
      <div>
        <div class="ticket-header">
          <span class="ticket-id">${t.id}</span>
          <div class="ticket-tags">
            <span class="badge badge-priority-${t.priority}">緊急度：${t.priority}</span>
            <span class="badge badge-status-${t.status}">${t.status}</span>
          </div>
        </div>

        <div class="ticket-title">${t.category} - ${t.device || "未註明設備"}</div>

        <div class="ticket-meta" style="margin-top: 10px;">
          <div class="meta-item"><i class="fa-solid fa-user"></i> ${t.reporter}</div>
          <div class="meta-item"><i class="fa-solid fa-phone"></i> ${t.phone || "無"}</div>
          <div class="meta-item" style="grid-column: 1 / -1;"><i class="fa-solid fa-location-dot"></i> ${t.location}</div>
        </div>

        <div class="ticket-desc" style="margin-top: 10px;">
          ${escapeHTML(t.description)}
        </div>
        ${t.note ? `<div style="font-size: 0.8rem; color: var(--accent-indigo); margin-top: 6px;">💡 維修備註：${escapeHTML(t.note)}</div>` : ''}
      </div>

      <div class="ticket-footer">
        <span class="ticket-time"><i class="fa-regular fa-clock"></i> ${t.createdAt}</span>
        <select class="status-select" onchange="updateTicketStatus('${t.id}', this.value)">
          <option value="待處理" ${t.status === "待處理" ? "selected" : ""}>待處理</option>
          <option value="處理中" ${t.status === "處理中" ? "selected" : ""}>處理中</option>
          <option value="已完成" ${t.status === "已完成" ? "selected" : ""}>已完成</option>
          <option value="已取消" ${t.status === "已取消" ? "selected" : ""}>已取消</option>
        </select>
      </div>
    </div>
  `).join("");
}

// 儲存 API 設定
async function saveApiSettings() {
  const url = DOM.apiUrlInput.value.trim();
  if (url && !url.startsWith("http")) {
    alert("請輸入有效的 HTTP / HTTPS Apps Script 網址");
    return;
  }

  state.apiUrl = url;
  localStorage.setItem("gas_repair_api_url", url);
  closeModal(DOM.settingsModal);

  setLoading(true);
  if (url) {
    // 測試連線 ping
    try {
      const res = await fetch(`${url}?action=ping&t=${new Date().getTime()}`);
      const data = await res.json();
      if (data.status === "success") {
        alert("✅ 連線測試成功！Apps Script 運作正常 (Execute as Me 免混淆模式)。");
      }
    } catch (e) {
      alert("⚠️ 已儲存網址，但連線測試時發生錯誤，請確認 Apps Script 部署權限設為 Anyone。");
    }
  }
  await loadData();
}

// 清空 API 設定
function clearApiSettings() {
  state.apiUrl = "";
  localStorage.removeItem("gas_repair_api_url");
  DOM.apiUrlInput.value = "";
  closeModal(DOM.settingsModal);
  loadData();
}

// API UI 狀態切換
function updateApiStatusUI(isOnline = false, customText = "") {
  if (!state.apiUrl) {
    DOM.statusDot.className = "status-dot mock";
    DOM.statusText.textContent = "本地 Mock 模式";
    return;
  }

  if (isOnline) {
    DOM.statusDot.className = "status-dot online";
    DOM.statusText.textContent = "GAS API 已連線 (免混淆)";
  } else {
    DOM.statusDot.className = "status-dot";
    DOM.statusText.textContent = customText || "連線檢測中...";
  }
}

// 輔助工具
function openModal(modalEl) { modalEl.classList.add("active"); }
function closeModal(modalEl) { modalEl.classList.remove("active"); }
function setLoading(loading) {
  state.isLoading = loading;
  if (loading) {
    DOM.refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 同步中...';
  } else {
    DOM.refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> 重新同步';
  }
}

function saveLocalMockTickets() {
  localStorage.setItem("local_mock_tickets", JSON.stringify(state.tickets));
}

function formatDate(dateObj) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
