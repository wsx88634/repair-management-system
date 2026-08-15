/**
 * 叫修輔助管理系統 - 全功能前端控制器 (Vue 3 + 免混淆 GAS API 整合)
 */

const { createApp, ref, reactive, computed, onMounted } = Vue;

const App = {
    setup() {
        // === 狀態欄位定型：未執行 -> 未完成 / 另約時間 -> 報價 -> 完修 -> 取消叫修 ===
        const statuses = ["未執行", "未完成 / 另約時間", "報價", "完修", "取消叫修"];
        const defaultEngineers = ["小張", "老王", "阿豪", "陳技師"];

        // 免混淆 GAS API URL (來自 LocalStorage)
        const apiUrl = ref(localStorage.getItem("gas_repair_api_url") || "");
        const showSettingsModal = ref(false);
        const apiUrlInput = ref(apiUrl.value);
        const isApiConnected = ref(false);

        // 預設示範叫修單據
        const defaultTickets = [
            {
                id: "T-8921",
                reportTime: new Date().toISOString().split('T')[0],
                customer: "台積電腦股份有限公司",
                model: "HP LaserJet Enterprise M507",
                engineer: "小張",
                slaDays: 2,
                status: "未完成 / 另約時間",
                completedDate: "",
                quoteState: "",
                isArchived: false,
                details: "故障問題：碳粉匣更換後依然報出 59.F0 錯誤訊息，列印有黑條紋。\n聯絡人：陳經理\n電話：0912-345-678\n地址：新竹科學園區研發六路 8 號",
                attachments: []
            },
            {
                id: "T-8922",
                reportTime: new Date().toISOString().split('T')[0],
                customer: "聯發科技二廠",
                model: "Epson WorkForce Pro WF-C878R",
                engineer: "未指派",
                slaDays: 1,
                status: "未執行",
                completedDate: "",
                quoteState: "",
                isArchived: false,
                details: "故障問題：自動進紙器雙面掃描時頻繁卡紙，面板顯示夾紙警報。\n聯絡人：林助理\n電話：0988-777-666\n地址：竹科篤行路 1 號 3F",
                attachments: []
            },
            {
                id: "T-8923",
                reportTime: new Date().toISOString().split('T')[0],
                customer: "鴻海精密研發中心",
                model: "Canon imageRUNNER ADVANCE C5535",
                engineer: "老王",
                slaDays: 3,
                status: "報價",
                completedDate: new Date().toISOString().split('T')[0],
                quoteState: "未報價",
                isArchived: false,
                details: "故障問題：彩色列印顏色嚴重偏差，加熱組老化異音。\n聯絡人：王組長\n電話：0911-222-333",
                attachments: []
            }
        ];

        // 全域狀態
        const engineers = ref([...defaultEngineers]);
        const tickets = ref([...defaultTickets]);
        const isLoading = ref(false);
        const isSaving = ref(false);

        // UI 區塊收合
        const isUnassignedExpanded = ref(true);
        const isQuoteExpanded = ref(true);

        // 表單資料
        const formData = reactive({
            reportDate: new Date().toISOString().split('T')[0],
            engineer: "未指派",
            slaDays: 3,
            customer: "",
            model: "",
            details: ""
        });

        // 彈窗狀態
        const showEngModal = ref(false);
        const newEngName = ref("");
        const editEngIndex = ref(-1);
        const editEngName = ref("");

        const selectedTicket = ref(null);
        const editData = ref(null);

        const showExportModal = ref(false);
        const isExportAuthenticated = ref(false);
        const exportPasswordInput = ref("");
        const exportDateRange = reactive({ start: "", end: "" });

        
        const showDayModal = ref(false);
        const selectedDay = ref(null);
        const openDayModal = (day) => { selectedDay.value = day; showDayModal.value = true; };
        const closeDayModal = () => { showDayModal.value = false; selectedDay.value = null; };
        const showSearchModal = ref(false);
        const searchInput = ref("");
        const activeSearchQuery = ref("");
        const openNotes = ref(new Set());

        const viewingImage = ref(null);

        const confirmDialog = reactive({
            isOpen: false,
            title: "",
            message: "",
            isWarning: false,
            onConfirm: null
        });

        // === 自動解析詳細備註裡的欄位 ===
        const parseDetails = (details) => {
            if (!details) return { contact: '', phone: '', address: '', warranty: '', issue: '' };
            const extractField = (str, regex) => {
                const match = str.match(regex);
                return match ? match[1].trim() : '';
            };
            return {
                contact: extractField(details, /(?:聯絡人|對口|負責人|姓名)[：:\s]*([^\n,，;]+)/),
                phone: extractField(details, /(?:電話|手機|聯絡電話|分機|TEL)[：:\s]*([^\n,，;]+)/),
                address: extractField(details, /(?:地址|地點|位置|廠區)[：:\s]*([^\n,，;]+)/),
                warranty: extractField(details, /(?:保固|合約|狀態)[：:\s]*([^\n,，;]+)/),
                issue: extractField(details, /(?:故障問題|故障原因|故障|固障|問題|原因)[：:\s]*([^\n]+)/)
            };
        };

        const toggleNote = (id) => {
            if (openNotes.value.has(id)) openNotes.value.delete(id);
            else openNotes.value.add(id);
        };
        const isNoteOpen = (id) => openNotes.value.has(id);

        // === 歷史搜尋計算屬性 ===
        const openSearchModal = () => {
            searchInput.value = '';
            activeSearchQuery.value = '';
            openNotes.value.clear();
            showSearchModal.value = true;
        };
        const closeSearchModal = () => { showSearchModal.value = false; };
        const executeSearch = () => { activeSearchQuery.value = searchInput.value.trim(); };

        const displayHistoryTickets = computed(() => {
            const query = activeSearchQuery.value.toLowerCase();
            let results = [...tickets.value];
            if (query) {
                results = results.filter(t => {
                    const cust = String(t.customer || '').toLowerCase();
                    const mod = String(t.model || '').toLowerCase();
                    const det = String(t.details || '').toLowerCase();
                    const eng = String(t.engineer || '').toLowerCase();
                    return cust.includes(query) || mod.includes(query) || det.includes(query) || eng.includes(query);
                });
            }
            results.sort((a, b) => new Date(b.reportTime) - new Date(a.reportTime));
            return query ? results : results.slice(0, 50);
        });

        const searchStats = computed(() => {
            if (!activeSearchQuery.value) return null;
            const matched = displayHistoryTickets.value;
            if (matched.length === 0) return { total: 0, completionRate: 0, avgSla: 0 };
            const total = matched.length;
            const completedCount = matched.filter(t => ["完修", "取消叫修"].includes(t.status)).length;
            const totalSla = matched.reduce((sum, t) => sum + (Number(t.slaDays) || 0), 0);
            return {
                total,
                completionRate: Math.round((completedCount / total) * 100),
                avgSla: Math.round((totalSla / total) * 10) / 10
            };
        });

        const unassignedTickets = computed(() => {
            return tickets.value
                .filter(t => (!t.engineer || t.engineer === '未指派') && !t.isArchived)
                .sort((a, b) => new Date(a.reportTime) - new Date(b.reportTime));
        });

        const quotingTickets = computed(() => {
            return tickets.value
                .filter(t => t.status === '報價' && !t.isArchived)
                .sort((a, b) => new Date(a.reportTime) - new Date(b.reportTime));
        });

        const quoteStats = computed(() => {
            const stats = { unquoted: 0, quoted: 0, agreed: 0 };
            quotingTickets.value.forEach(t => {
                const state = t.quoteState || '未報價';
                if (state === '未報價') stats.unquoted++;
                else if (state === '已報價') stats.quoted++;
                else if (state === '同意報價') stats.agreed++;
            });
            return stats;
        });

        // === 資料讀取與寫入 ===
        const mergeTickets = (incoming) => {
            const localMap = new Map(tickets.value.map(t => [t.id, t]));
            return incoming.map(inc => {
                const local = localMap.get(inc.id);
                let safeReportDate = String(inc.reportTime || "");
                if (safeReportDate.includes("T")) safeReportDate = safeReportDate.split("T")[0];
                else safeReportDate = safeReportDate.split(" ")[0];

                let safeCompletedDate = inc.completedDate || (local ? local.completedDate : '') || '';
                if (safeCompletedDate && safeCompletedDate.includes("T")) safeCompletedDate = safeCompletedDate.split("T")[0];

                let safeStatus = inc.status || "未執行";
                if (safeStatus === "零件到達/待處理" || safeStatus === "未完成 另約時間") {
                    safeStatus = "未完成 / 另約時間";
                }
                if (safeStatus === "處理中") {
                    safeStatus = "未完成 / 另約時間";
                }

                let safeAttachments = [];
                let rawAttachments = inc.attachments !== undefined ? inc.attachments : (local ? local.attachments : []);
                if (Array.isArray(rawAttachments)) safeAttachments = rawAttachments;
                else if (typeof rawAttachments === 'string' && rawAttachments.startsWith('data:image')) safeAttachments = [rawAttachments];

                safeAttachments = safeAttachments.filter(item => typeof item === 'string' && item.startsWith('data:image')).slice(0, 1);

                return {
                    ...inc,
                    status: safeStatus,
                    reportTime: safeReportDate,
                    completedDate: safeCompletedDate,
                    quoteState: inc.quoteState || (local ? local.quoteState : '') || '',
                    isArchived: inc.isArchived || (local ? local.isArchived : false) || false,
                    attachments: safeAttachments
                };
            });
        };

        const fetchData = async (isBackground) => {
            const isSilent = isBackground === true;
            if (!apiUrl.value) {
                const localData = localStorage.getItem("local_repair_tickets_v2");
                const localEngs = localStorage.getItem("local_repair_engineers_v2");
                if (localData) { try { tickets.value = JSON.parse(localData); } catch(e){} }
                if (localEngs) { try { engineers.value = JSON.parse(localEngs); } catch(e){} }
                isApiConnected.value = false;
                return;
            }

            if (!isSilent) isLoading.value = true;
            try {
                const url = `${apiUrl.value}?action=getData&t=${new Date().getTime()}`;
                const res = await fetch(url);
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch (e) {
                    throw new Error("無法取得正確 JSON 資料格式 (收到 HTML)。請確認在 GAS 部署選擇 Execute as: Me 與 Who has access: Anyone！");
                }

                if (data.tickets) tickets.value = mergeTickets(data.tickets);
                if (data.engineers && Array.isArray(data.engineers)) engineers.value = data.engineers;
                isApiConnected.value = true;
            } catch (error) {
                console.error("讀取失敗：", error);
                isApiConnected.value = false;
                if (!isSilent) {
                    confirmDialog.title = "資料同步失敗";
                    confirmDialog.message = error.message || "發生未知錯誤，請檢查網路連線或 API URL。";
                    confirmDialog.isWarning = true;
                    confirmDialog.isOpen = true;
                }
            } finally {
                if (!isSilent) isLoading.value = false;
            }
        };

        const saveData = async () => {
            localStorage.setItem("local_repair_tickets_v2", JSON.stringify(tickets.value));
            localStorage.setItem("local_repair_engineers_v2", JSON.stringify(engineers.value));

            if (!apiUrl.value) return;

            isSaving.value = true;
            isLoading.value = true;
            try {
                const payloadTickets = tickets.value.map(t => ({
                    ...t,
                    completedDate: t.completedDate || '',
                    quoteState: t.quoteState || '',
                    isArchived: t.isArchived || false,
                    attachments: t.attachments || []
                }));

                const res = await fetch(apiUrl.value, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ tickets: payloadTickets, engineers: engineers.value })
                });
                const text = await res.text();
                try { JSON.parse(text); } catch (e) {
                    throw new Error("無法取得正確 JSON 資料格式 (收到 HTML)。請確認在 GAS 部署選擇 Execute as: Me 與 Who has access: Anyone。");
                }
                isApiConnected.value = true;
            } catch (error) {
                console.error("儲存失敗：", error);
                isApiConnected.value = false;
                confirmDialog.title = "資料儲存失敗";
                confirmDialog.message = error.message || "請檢查網路連線與 Apps Script 部署權限。";
                confirmDialog.isWarning = true;
                confirmDialog.isOpen = true;
            } finally {
                isSaving.value = false;
                isLoading.value = false;
            }
        };

        // 後端連線設定
        const saveApiSettings = async () => {
            const url = apiUrlInput.value.trim();
            apiUrl.value = url;
            localStorage.setItem("gas_repair_api_url", url);
            showSettingsModal.value = false;
            await fetchData(false);
        };

        const clearApiSettings = () => {
            apiUrl.value = "";
            apiUrlInput.value = "";
            localStorage.removeItem("gas_repair_api_url");
            showSettingsModal.value = false;
            fetchData(false);
        };

        onMounted(() => {
            fetchData(false);
            setInterval(() => {
                if (!selectedTicket.value && !showEngModal.value && !showSearchModal.value && !confirmDialog.isOpen) {
                    fetchData(true);
                }
            }, 60000);
        });

        // === 看板顏色與卡片樣式 ===
        const getStatusColor = (ticket) => {
            if (!ticket) return "bg-white border-slate-200";
            const status = typeof ticket === 'string' ? ticket : ticket.status;
            if (status === "報價") {
                const qState = typeof ticket === 'string' ? '未報價' : (ticket.quoteState || '未報價');
                if (qState === '未報價') return "bg-red-50/90 border-red-300 text-red-900 border-[2px] shadow-sm";
                if (qState === '已報價') return "bg-amber-50/90 border-amber-300 text-amber-900 border-[2px] shadow-sm";
                if (qState === '同意報價') return "bg-blue-50/90 border-blue-300 text-blue-900 border-[2px] shadow-sm";
            }
            switch (status) {
                case "未執行": 
                    return "bg-red-50/80 border-red-200 text-red-900";
                case "未完成 / 另約時間": 
                case "未完成 另約時間": 
                    return "bg-purple-100 border-purple-300 text-purple-900 border-[2px] shadow-sm";
                case "完修": 
                    return "bg-emerald-50/80 border-emerald-200 text-emerald-900";
                case "取消叫修": 
                    return "bg-slate-100 border-slate-300 text-slate-700";
                default: 
                    return "bg-white border-slate-200";
            }
        };

        const getTickets = (engineer, status) => {
            return tickets.value.filter(t => t.engineer === engineer && t.status === status && !t.isArchived);
        };

        const changeQuoteState = async (ticket, newState) => {
            const index = tickets.value.findIndex(t => t.id === ticket.id);
            if (index !== -1) {
                tickets.value[index].quoteState = newState;
                await saveData();
            }
        };

        const handleDateAndStatus = (ticket, newStatus) => {
            if (["報價", "完修", "取消叫修"].includes(newStatus)) {
                if (!ticket.completedDate) {
                    const d = new Date();
                    ticket.completedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
            } else {
                ticket.completedDate = '';
            }
            if (newStatus === "報價" && !ticket.quoteState) {
                ticket.quoteState = "未報價";
            }
        };

        const isOverdue = (ticket) => {
            if (["報價", "完修", "取消叫修"].includes(ticket.status)) return false;
            const diffTime = new Date().getTime() - new Date(ticket.reportTime).getTime();
            return Math.floor(diffTime / (1000 * 60 * 60 * 24)) > ticket.slaDays;
        };

        // 拖拽排程
        const onDragStart = (e, id) => { e.dataTransfer.setData("ticketId", id); };
        const onDrop = async (e, targetEngineer, targetStatus) => {
            const ticketId = e.dataTransfer.getData("ticketId");
            const index = tickets.value.findIndex(t => t.id === ticketId);
            if (index !== -1) {
                const newStatus = targetEngineer === '未指派' ? '未執行' : targetStatus;
                const updatedTicket = {
                    ...tickets.value[index],
                    engineer: targetEngineer,
                    status: newStatus
                };
                handleDateAndStatus(updatedTicket, newStatus);
                tickets.value.splice(index, 1, updatedTicket);
                await saveData();
            }
        };

        // 新增派單
        const handleAddTicket = async () => {
            if (!formData.customer?.trim() || !formData.model?.trim()) {
                confirmDialog.title = "提醒事項";
                confirmDialog.message = "請填寫客戶名稱與機型！";
                confirmDialog.isWarning = true;
                confirmDialog.isOpen = true;
                return;
            }
            const newId = `T-${Math.floor(Math.random() * 9000 + 1000)}`;
            tickets.value.push({
                ...formData,
                id: newId,
                status: "未執行",
                reportTime: formData.reportDate,
                completedDate: '',
                quoteState: '',
                isArchived: false,
                attachments: []
            });
            formData.customer = ""; formData.model = ""; formData.details = ""; formData.engineer = "未指派";
            await saveData();
        };

        // 單據 Modal 編輯
        const openTicketModal = (ticket) => {
            selectedTicket.value = ticket;
            editData.value = JSON.parse(JSON.stringify(ticket));
        };
        const closeTicketModal = () => { selectedTicket.value = null; };
        const saveTicketModal = async () => {
            const index = tickets.value.findIndex(t => t.id === editData.value.id);
            if (index !== -1) {
                if (editData.value.engineer === '未指派') editData.value.status = '未執行';
                handleDateAndStatus(editData.value, editData.value.status);
                tickets.value[index] = { ...editData.value };
            }
            closeTicketModal();
            await saveData();
        };

        // 封存與刪除
        const confirmArchiveTicket = (id) => {
            confirmDialog.title = "封存叫修單據";
            confirmDialog.message = `確定要封存這張單據嗎？\n封存後卡片將從所有工程師看板中隱藏，但仍可於「歷史複查」與「匯出報表」中找到它。`;
            confirmDialog.isWarning = false;
            confirmDialog.isOpen = true;
            confirmDialog.onConfirm = async () => {
                const index = tickets.value.findIndex(t => t.id === id);
                if (index !== -1) {
                    tickets.value[index].isArchived = true;
                }
                if (selectedTicket.value?.id === id) closeTicketModal();
                await saveData();
            };
        };

        const unarchiveTicket = async (id) => {
            const index = tickets.value.findIndex(t => t.id === id);
            if (index !== -1) {
                tickets.value[index].isArchived = false;
                if (selectedTicket.value?.id === id) editData.value.isArchived = false;
                await saveData();
            }
        };

        const confirmBatchArchive = () => {
            const targets = tickets.value.filter(t => !t.isArchived && (t.status === '完修' || t.status === '取消叫修'));
            if (targets.length === 0) {
                confirmDialog.title = "無可封存的單據";
                confirmDialog.message = "目前看板上沒有狀態為「完修」或「取消叫修」的單據需要封存。";
                confirmDialog.isWarning = false; confirmDialog.isOpen = true; confirmDialog.onConfirm = null;
                return;
            }
            confirmDialog.title = "一鍵封存結案單據";
            confirmDialog.message = `偵測到看板上有 ${targets.length} 筆「完修」或「取消叫修」的單據。\n\n確定要一次全部封存嗎？`;
            confirmDialog.isWarning = false; confirmDialog.isOpen = true;
            confirmDialog.onConfirm = async () => {
                tickets.value.forEach((t, i) => {
                    if (!t.isArchived && (t.status === '完修' || t.status === '取消叫修')) {
                        tickets.value[i].isArchived = true;
                    }
                });
                await saveData();
            };
        };

        const confirmHardDeleteTicket = (id) => {
            confirmDialog.title = "⚠️ 永久刪除此單";
            confirmDialog.message = `確定要永久刪除這張單據嗎？此操作不可復原！`;
            confirmDialog.isWarning = true; confirmDialog.isOpen = true;
            confirmDialog.onConfirm = async () => {
                tickets.value = tickets.value.filter(t => t.id !== id);
                if (selectedTicket.value?.id === id) closeTicketModal();
                await saveData();
            };
        };

        const executeConfirm = () => {
            if (confirmDialog.onConfirm) confirmDialog.onConfirm();
            confirmDialog.isOpen = false;
        };

        // 團隊管理
        const addEngineer = async () => {
            const name = newEngName.value.trim();
            if (name && !engineers.value.includes(name) && name !== '未指派') {
                engineers.value.push(name);
                newEngName.value = '';
                await saveData();
            }
        };
        const startEditEngineer = (index, name) => { editEngIndex.value = index; editEngName.value = name; };
        const saveEngineerEdit = async (index) => {
            const oldName = engineers.value[index];
            const finalName = editEngName.value.trim();
            if (!finalName || finalName === '未指派' || engineers.value.includes(finalName) && finalName !== oldName) {
                editEngIndex.value = -1; return;
            }
            engineers.value[index] = finalName;
            tickets.value.forEach(t => { if (t.engineer === oldName) t.engineer = finalName; });
            editEngIndex.value = -1;
            await saveData();
        };
        const confirmDeleteEngineer = (index) => {
            const targetName = engineers.value[index];
            if (tickets.value.some(t => t.engineer === targetName)) {
                confirmDialog.title = "刪除警告";
                confirmDialog.message = `「${targetName}」名下還有派單！請先移轉工程師。`;
                confirmDialog.isWarning = true; confirmDialog.isOpen = true; return;
            }
            confirmDialog.title = "刪除工程師"; confirmDialog.message = `確定要移除「${targetName}」嗎？`;
            confirmDialog.isWarning = false; confirmDialog.isOpen = true;
            confirmDialog.onConfirm = async () => { engineers.value.splice(index, 1); await saveData(); };
        };

        // 匯出 CSV 報表
        const openExportModal = () => {
            isExportAuthenticated.value = false;
            exportPasswordInput.value = '';
            showExportModal.value = true;
        };

        const verifyExportPassword = () => {
            if (String(exportPasswordInput.value || '').trim() === '54839497') {
                isExportAuthenticated.value = true;
                exportPasswordInput.value = '';
            } else {
                confirmDialog.title = "授權失敗";
                confirmDialog.message = "密碼不正確！";
                confirmDialog.isWarning = true; confirmDialog.isOpen = true;
                exportPasswordInput.value = '';
            }
        };

        const executeExport = () => {
            let exportData = tickets.value;
            if (exportDateRange.start) exportData = exportData.filter(t => new Date(t.reportTime).getTime() >= new Date(exportDateRange.start).getTime());
            if (exportDateRange.end) exportData = exportData.filter(t => new Date(t.reportTime).getTime() <= (new Date(exportDateRange.end).getTime() + 86399999));
            downloadCSV(exportData, `叫修管理報表_${exportDateRange.start || '全部'}_至_${exportDateRange.end || '全部'}`);
            showExportModal.value = false;
        };

        const executeExportAll = () => {
            downloadCSV(tickets.value, `全域叫修資料庫報表_${new Date().toISOString().split('T')[0]}`);
            showExportModal.value = false;
        };

        const exportSearchResult = () => {
            downloadCSV(displayHistoryTickets.value, `歷史複查搜尋結果_${activeSearchQuery.value || '最新'}`);
        };

        const downloadCSV = (exportData, filenamePrefix) => {
            const headers = ['編號', '報修日期', '完成日期', '當前狀態', '報價進度', '歸檔狀態', '負責工程師', '客戶名稱', '機型', '時效(天)', '聯絡人', '電話', '地址', '保固', '故障問題', '原始備註'];
            const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
            const rows = exportData.map(t => {
                const p = parseDetails(t.details);
                return [t.id, t.reportTime, t.completedDate || '', t.status, t.quoteState || '', t.isArchived ? '已封存' : '處理中', t.engineer, escapeCSV(t.customer), escapeCSV(t.model), t.slaDays, escapeCSV(p.contact), escapeCSV(p.phone), escapeCSV(p.address), escapeCSV(p.warranty), escapeCSV(p.issue), escapeCSV(t.details)];
            });
            const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.setAttribute('href', url);
            link.setAttribute('download', `${filenamePrefix}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        };

        // html2canvas 截圖
        const captureSection = (elementId, prefix) => {
            const sectionEl = document.getElementById(elementId);
            if (!sectionEl) return;
            const scrollEl = sectionEl.querySelector('.capture-container');
            let origMaxHeight = '', origOverflow = '';
            if (scrollEl) {
                origMaxHeight = scrollEl.style.maxHeight || ''; origOverflow = scrollEl.style.overflow || '';
                scrollEl.style.maxHeight = 'none'; scrollEl.style.overflow = 'visible';
            }
            isLoading.value = true;
            setTimeout(() => {
                html2canvas(sectionEl, {
                    useCORS: true, backgroundColor: '#F8FAFC', scale: 2, logging: false
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.setAttribute('download', `${prefix}_${new Date().toISOString().split('T')[0]}.jpg`);
                    link.setAttribute('href', canvas.toDataURL('image/jpeg', 0.95));
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    if (scrollEl) { scrollEl.style.maxHeight = origMaxHeight; scrollEl.style.overflow = origOverflow; }
                    isLoading.value = false;
                }).catch(() => {
                    if (scrollEl) { scrollEl.style.maxHeight = origMaxHeight; scrollEl.style.overflow = origOverflow; }
                    isLoading.value = false;
                });
            }, 400);
        };

        const captureBoard = () => {
            const boardEl = document.getElementById('kanban-board');
            if (!boardEl) return;
            isLoading.value = true;
            setTimeout(() => {
                html2canvas(boardEl, {
                    useCORS: true, backgroundColor: '#F8FAFC', scale: 2, logging: false
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.setAttribute('download', `主看板狀態_${new Date().toISOString().split('T')[0]}.jpg`);
                    link.setAttribute('href', canvas.toDataURL('image/jpeg', 0.95));
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    isLoading.value = false;
                }).catch(() => { isLoading.value = false; });
            }, 300);
        };

        // 圖片處理與 Base64 壓縮
        const viewImage = (imgSrc) => { viewingImage.value = imgSrc; };
        const removeAttachment = (index) => {
            if (editData.value && editData.value.attachments) {
                editData.value.attachments.splice(index, 1);
            }
        };

        const compressImageToSafeSize = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        let width = img.width, height = img.height, quality = 0.8;
                        const MAX_DIMENSION = 800;
                        if (width > height) {
                            if (width > MAX_DIMENSION) { height = Math.round((height * MAX_DIMENSION) / width); width = MAX_DIMENSION; }
                        } else {
                            if (height > MAX_DIMENSION) { width = Math.round((width * MAX_DIMENSION) / height); height = MAX_DIMENSION; }
                        }
                        const getCompressed = (w, h, q) => {
                            canvas.width = w; canvas.height = h;
                            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
                            ctx.drawImage(img, 0, 0, w, h);
                            return canvas.toDataURL('image/jpeg', q);
                        };
                        let base64 = getCompressed(width, height, quality);
                        const MAX_CHARS = 45000;
                        let attempts = 0;
                        while (base64.length > MAX_CHARS && attempts < 10) {
                            attempts++; quality -= 0.1;
                            if (quality < 0.4) { width = Math.round(width * 0.8); height = Math.round(height * 0.8); quality = 0.7; }
                            base64 = getCompressed(width, height, quality);
                        }
                        resolve(base64);
                    };
                    img.onerror = () => reject(new Error("讀取圖片失敗"));
                };
            });
        };

        const handleImageUpload = async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            if (!editData.value.attachments) editData.value.attachments = [];
            if (editData.value.attachments.length + files.length > 1) {
                confirmDialog.title = "附件限制"; confirmDialog.message = "每筆單據最多夾帶 1 張圖片。";
                confirmDialog.isWarning = true; confirmDialog.isOpen = true; event.target.value = null; return;
            }
            isLoading.value = true;
            try {
                for (let i = 0; i < files.length; i++) {
                    const base64 = await compressImageToSafeSize(files[i]);
                    editData.value.attachments.push(base64);
                }
            } catch (err) {
                confirmDialog.title = "處理失敗"; confirmDialog.message = err.message;
                confirmDialog.isWarning = true; confirmDialog.isOpen = true;
            } finally {
                event.target.value = null; isLoading.value = false;
            }
        };

        return {
            statuses, engineers, tickets, formData, getTickets, getStatusColor,
            isOverdue, onDragStart, onDrop, handleAddTicket, unassignedTickets,
            showEngModal, newEngName, editEngIndex, editEngName, addEngineer, startEditEngineer, saveEngineerEdit, confirmDeleteEngineer,
            selectedTicket, editData, openTicketModal, closeTicketModal, saveTicketModal,
            confirmDialog, executeConfirm, isLoading,
            confirmArchiveTicket, unarchiveTicket, confirmHardDeleteTicket, confirmBatchArchive,
            captureBoard, captureSection, showExportModal, exportDateRange, openExportModal, executeExport, executeExportAll,
            isExportAuthenticated, exportPasswordInput, verifyExportPassword,
            showDayModal, selectedDay, openDayModal, closeDayModal,
                    showSearchModal, searchInput, activeSearchQuery, openSearchModal, closeSearchModal, executeSearch,
            displayHistoryTickets, searchStats, parseDetails, toggleNote, isNoteOpen, exportSearchResult,
            fetchData, quotingTickets, quoteStats, changeQuoteState,
            isUnassignedExpanded, isQuoteExpanded,
            viewingImage, viewImage, handleImageUpload, removeAttachment,
            apiUrl, showSettingsModal, apiUrlInput, isApiConnected, saveApiSettings, clearApiSettings
        };
    }
};

const app = createApp(App);

app.component('l-icon', {
    props: ['name'],
    data() { return { iconHtml: '' }; },
    watch: {
        name: {
            immediate: true,
            handler(newVal) {
                if (window.lucide && newVal) {
                    const temp = document.createElement('div');
                    temp.innerHTML = `<i data-lucide="${newVal}"></i>`;
                    window.lucide.createIcons({ root: temp });
                    const svg = temp.querySelector('svg');
                    if (svg) {
                        svg.removeAttribute('width'); svg.removeAttribute('height');
                        svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
                        this.iconHtml = temp.innerHTML;
                    }
                }
            }
        }
    },
    template: `<span class="inline-flex items-center justify-center l-icon-wrapper pointer-events-none" v-html="iconHtml"></span>`
});

app.mount('#app');
