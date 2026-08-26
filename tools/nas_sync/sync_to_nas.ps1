# ==========================================================
# 叫修系統 - Google Drive 照片與報價單 NAS 自動同步歸檔工具
# ==========================================================

[CmdletBinding()]
param (
    [string]$NasPath,
    [string]$ApiUrl,
    [int]$IntervalMinutes = 0,
    [switch]$RunOnce
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigFile = Join-Path $ScriptDir 'config.json'
$HistoryFile = Join-Path $ScriptDir 'download_history.txt'
$LogFile = Join-Path $ScriptDir 'sync_log.txt'

# 讀取設定檔
if (Test-Path $ConfigFile) {
    try {
        $cfg = Get-Content -Path $ConfigFile -Raw -Encoding utf8 | ConvertFrom-Json
        if (-not $NasPath -and $cfg.NasPath) { $NasPath = $cfg.NasPath }
        if (-not $ApiUrl -and $cfg.ApiUrl) { $ApiUrl = $cfg.ApiUrl }
        if ($IntervalMinutes -le 0 -and $cfg.IntervalMinutes) { $IntervalMinutes = [int]$cfg.IntervalMinutes }
    } catch {}
}

if (-not $NasPath) { $NasPath = '\\192.168.1.210\engineer\工單照片報價單' }
if (-not $ApiUrl) { $ApiUrl = 'https://script.google.com/macros/s/AKfycbzfYZJIjZU2tsO1X5PMiqkDD7lsuJNgOcP1KfE6kn3okznCBd7Klct3sOgOZ8UpoHOsdg/exec' }
if ($IntervalMinutes -le 0) { $IntervalMinutes = 3 }

function Write-Log {
    param ([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logLine = "[$timestamp] $Message"
    Write-Host $logLine
    try {
        Add-Content -Path $LogFile -Value $logLine -Encoding utf8
    } catch {}
}

if (-not (Test-Path $HistoryFile)) {
    New-Item -ItemType File -Path $HistoryFile -Force | Out-Null
}

function Get-HistorySet {
    $set = [System.Collections.Generic.HashSet[string]]::new()
    if (Test-Path $HistoryFile) {
        $lines = Get-Content -Path $HistoryFile -Encoding utf8
        foreach ($line in $lines) {
            if ($line -and $line.Trim()) {
                $null = $set.Add($line.Trim())
            }
        }
    }
    return $set
}

function Extract-DriveFileId {
    param ([string]$Url)
    if (-not $Url) { return $null }
    if ($Url -match 'drive\.google\.com/file/d/([^/?#]+)') { return $matches[1] }
    if ($Url -match 'googleusercontent\.com/d/([^/?#]+)') { return $matches[1] }
    if ($Url -match '[?&]id=([^&#]+)') { return $matches[1] }
    if ($Url -match '/d/([^/?#]+)') { return $matches[1] }
    return $null
}

function Sanitize-FileName {
    param ([string]$Name)
    if (-not $Name) { return '未命名' }
    $invalid = [System.IO.Path]::GetInvalidFileNameChars()
    foreach ($c in $invalid) {
        $Name = $Name.Replace($c, '_')
    }
    return $Name.Trim()
}

function Sync-Attachments {
    Write-Log '開始檢查叫修雲端資料庫...'
    
    if (-not (Test-Path $NasPath)) {
        Write-Log "⚠️ 警告：無法連線至 NAS 路徑 [$NasPath]，請確認公司區網連線是否正常！"
        return
    }

    $history = Get-HistorySet

    try {
        $epoch = [int64]((Get-Date).ToUniversalTime() - [datetime]'1970-01-01').TotalSeconds
        $fullApiUrl = $ApiUrl + '?action=getData&t=' + $epoch
        $response = Invoke-RestMethod -Uri $fullApiUrl -Method Get -TimeoutSec 30
    } catch {
        Write-Log "❌ 連線 API 失敗：$($_.Exception.Message)"
        return
    }

    if ($response.status -ne 'success' -or -not $response.tickets) {
        Write-Log '⚠️ 取得單據資料失敗或無資料。'
        return
    }

    $tickets = $response.tickets
    $newCount = 0

    foreach ($ticket in $tickets) {
        if (-not $ticket.attachments -or $ticket.attachments.Count -eq 0) { continue }
        
        $ticketId = $ticket.id
        $customer = Sanitize-FileName $ticket.customer
        $reportTime = if ($ticket.reportTime) { ($ticket.reportTime -split 'T')[0] } else { '未註明日期' }
        $monthFolder = if ($reportTime -match '^\d{4}-\d{2}') { $reportTime.Substring(0, 7) } else { '其他' }

        $monthPath = Join-Path $NasPath $monthFolder
        $targetFolder = Join-Path $monthPath ($ticketId + '_' + $customer)

        $attIndex = 1
        foreach ($attUrl in $ticket.attachments) {
            if (-not $attUrl -or $attUrl.StartsWith('data:image')) { continue }

            $fileId = Extract-DriveFileId $attUrl
            if (-not $fileId) { continue }

            if ($history.Contains($fileId)) {
                $attIndex++
                continue
            }

            if (-not (Test-Path $targetFolder)) {
                New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
            }

            $isPdf = $attUrl -match '\.pdf' -or $attUrl -match 'drive\.google\.com/file'
            $ext = if ($isPdf) { '.pdf' } else { '.jpg' }
            $fileName = $ticketId + '_' + $customer + '_附件' + $attIndex + $ext
            $destination = Join-Path $targetFolder $fileName

            $downloadUrl = 'https://drive.google.com/uc?export=download&id=' + $fileId
            
            try {
                Write-Log "📥 正在下載：[$ticketId] $customer ➔ $fileName"
                Invoke-WebRequest -Uri $downloadUrl -OutFile $destination -TimeoutSec 60
                
                Add-Content -Path $HistoryFile -Value $fileId -Encoding utf8
                $null = $history.Add($fileId)
                $newCount++
                Write-Log "✅ 成功存入 NAS：$destination"
            } catch {
                Write-Log "❌ 下載失敗 ($fileId)：$($_.Exception.Message)"
            }

            $attIndex++
        }
    }

    if ($newCount -gt 0) {
        Write-Log "🎉 本次同步完成，共新增 $newCount 份檔案至 NAS！"
    } else {
        Write-Log '✅ 檢查完成，目前所有照片與報價單皆為最新狀態。'
    }
}

if ($RunOnce) {
    Sync-Attachments
} else {
    Write-Log "🚀 叫修系統 NAS 自動同步服務已啟動 (每 $IntervalMinutes 分鐘自動檢查一次)..."
    while ($true) {
        Sync-Attachments
        Start-Sleep -Seconds ($IntervalMinutes * 60)
    }
}
