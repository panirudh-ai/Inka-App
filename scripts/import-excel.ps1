param(
  [string]$ExcelPath = "C:\Users\Kalai\Downloads\INKA Project Management APP.xlsx",
  [string]$ApiBase = "http://localhost:4000/api",
  [string]$AdminEmail = "admin@inka.local",
  [string]$AdminPassword = "Inka@123",
  [string]$ApproverEmail = "admin@inka.local",
  [string]$ApproverPassword = "Inka@123",
  [string]$DefaultCategoryName = "Legacy Imported",
  [int]$MaxProjects = 0,
  [ValidateSet("dry-run", "commit")] [string]$Mode = "dry-run",
  [string]$SummaryPath = ".\import-summary.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$IsDryRun = $Mode -eq "dry-run"
$summary = [ordered]@{
  mode = $Mode
  startedAt = (Get-Date).ToString("s")
  projectsSeen = 0
  projectsImported = 0
  projectsSkipped = 0
  projectsFailed = 0
  created = [ordered]@{
    clients = 0
    categories = 0
    productTypes = 0
    brands = 0
    items = 0
    projects = 0
    changeRequests = 0
    crItems = 0
  }
  failures = @()
}

function Invoke-JsonApi {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [string]$Token = $null
  )
  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $params = @{
    Method      = $Method
    Uri         = $Url
    Headers     = $headers
    ContentType = "application/json"
  }
  if ($null -ne $Body) {
    $json = ($Body | ConvertTo-Json -Depth 20 -Compress)
    $params["Body"] = $json
    $params["ContentType"] = "application/json; charset=utf-8"
  }
  try {
    return Invoke-RestMethod @params
  } catch {
    $msg = $_.Exception.Message
    try {
      $resp = $_.Exception.Response
      if ($resp -and $resp.GetResponseStream) {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $sr.ReadToEnd()
        $sr.Close()
        if ($body) { $msg = "$msg | $body" }
      }
    } catch {}
    throw ("API failed: $Method $Url -> $msg")
  }
}

function As-List {
  param([object]$Value)
  if ($null -eq $Value) { return @() }
  if ($Value -is [System.Array]) { return @($Value) }
  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    return @($Value)
  }
  return @($Value)
}

function Has-Prop {
  param([object]$Obj, [string]$Name)
  if ($null -eq $Obj) { return $false }
  return ($Obj.PSObject.Properties.Name -contains $Name)
}

function Login {
  param([string]$Email, [string]$Password)
  $resp = Invoke-JsonApi -Method "POST" -Url "$ApiBase/auth/login" -Body @{
    email    = $Email
    password = $Password
  }
  return $resp.token
}

function Normalize-Text {
  param([string]$Value)
  if ($null -eq $Value) { return "" }
  return ($Value -replace "\r|\n", " ").Trim()
}

function Normalize-Key {
  param([string]$Value)
  $v = (Normalize-Text $Value).ToLowerInvariant()
  $v = ($v -replace "[^a-z0-9]", "")
  return $v
}

function Normalize-UrlOrEmpty {
  param([string]$Value)
  $v = Normalize-Text $Value
  if (-not $v) { return "" }
  if ($v -match "^(https?://)") { return $v }
  if ($v -match "drive\.google\.com") {
    if ($v -notmatch "^https?://") { return "https://$v" }
    return $v
  }
  return ""
}

function Sanitize-EntityName {
  param([string]$Value, [string]$Fallback = "Unknown")
  $v = Normalize-Text $Value
  $v = ($v -replace "[\u0000-\u001F]", " ")
  $v = ($v -replace "\s+", " ").Trim()
  if (-not $v -or $v.Length -lt 2) { $v = $Fallback }
  if ($v.Length -gt 140) { $v = $v.Substring(0, 140).Trim() }
  if ($v.Length -lt 2) { $v = $Fallback }
  return $v
}

function Parse-Number {
  param([string]$Value)
  $v = Normalize-Text $Value
  if (-not $v) { return 0 }
  $clean = ($v -replace "[^0-9\.\-]", "")
  if (-not $clean) { return 0 }
  $out = 0.0
  if ([double]::TryParse($clean, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$out)) {
    return [math]::Round($out, 2)
  }
  return 0
}

function Map-SiteStatus {
  param([string]$Raw)
  $v = (Normalize-Text $Raw).ToLowerInvariant()
  if ($v -match "yet to start") { return "Work Yet to Start" }
  if ($v -match "position marked") { return "Position Marked" }
  if ($v -match "piping done") { return "Piping Done" }
  if ($v -match "wiring done") { return "Wiring Done" }
  if ($v -match "checked ok") { return "Wiring Checked OK" }
  if ($v -match "rework") { return "Wiring Rework Required" }
  if ($v -match "provision not provided") { return "Provision Not Provided" }
  if ($v -match "position to be changed") { return "Position To Be Changed" }
  if ($v -match "installed.+working") { return "Installed - Working" }
  if ($v -match "installed.+activate") { return "Installed - To Activate" }
  if ($v -match "installed.+not working") { return "Installed - Not Working" }
  return "Work Yet to Start"
}

function Is-MeaningfulValue {
  param([string]$Raw)
  $v = (Normalize-Text $Raw).ToLowerInvariant()
  if (-not $v) { return $false }
  if ($v -in @("system.xml.xmlelement", "count", "%", "overall site status", "material status")) { return $false }
  if ($v -match "^(visit no|sr no|ir no|date|client name|site|location|phone number)$") { return $false }
  if ($v.Length -lt 2) { return $false }
  if ($v -notmatch "[a-z]") { return $false }
  return $true
}

function Get-XlsxWorkbookData {
  param([string]$Path)

  Add-Type -AssemblyName System.IO.Compression
  $fs = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
  $zip = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Read)

  function Get-EntryText([string]$Name) {
    $e = $zip.Entries | Where-Object { $_.FullName -eq $Name } | Select-Object -First 1
    if (-not $e) { return $null }
    $sr = New-Object System.IO.StreamReader($e.Open())
    $txt = $sr.ReadToEnd()
    $sr.Close()
    return $txt
  }

  function CellToValue($c, $shared) {
    if ($null -eq $c) { return "" }
    $t = ""
    if ($c.PSObject.Properties.Name -contains "t") {
      $t = [string]$c.t
    }
    if ($t -eq "s") {
      $idx = [int]$c.v
      return [string]$shared[$idx]
    }
    if (($c.PSObject.Properties.Name -contains "is") -and $c.is -and ($c.is.PSObject.Properties.Name -contains "t")) { return [string]$c.is.t }
    if ($c.PSObject.Properties.Name -contains "v") {
      return [string]$c.v
    }
    return ""
  }

  $wbXml = [xml](Get-EntryText "xl/workbook.xml")
  $relsXml = [xml](Get-EntryText "xl/_rels/workbook.xml.rels")
  $ssRaw = Get-EntryText "xl/sharedStrings.xml"
  $shared = @()
  if ($ssRaw) {
    $ssXml = [xml]$ssRaw
    foreach ($si in $ssXml.sst.si) {
      if ($si.PSObject.Properties.Name -contains "t") { $shared += [string]$si.t }
      elseif ($si.PSObject.Properties.Name -contains "r") { $shared += (($si.r | ForEach-Object { $_.t }) -join "") }
      else { $shared += "" }
    }
  }

  $sheetTargetByRid = @{}
  foreach ($rel in $relsXml.Relationships.Relationship) {
    $sheetTargetByRid[$rel.Id] = $rel.Target
  }

  $sheets = @{}
  $sheetOrder = @()
  foreach ($s in $wbXml.workbook.sheets.sheet) {
    $name = [string]$s.name
    $sheetOrder += $name
    $rid = $s.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    $target = $sheetTargetByRid[$rid]
    if (-not $target) { continue }
    $full = if ($target.StartsWith('/')) { "xl$target" } else { "xl/$target" }
    $raw = Get-EntryText $full
    if (-not $raw) { continue }
    $xml = [xml]$raw
    $rows = @()
    if (-not ($xml.worksheet -and ($xml.worksheet.PSObject.Properties.Name -contains "sheetData"))) {
      $sheets[$name] = $rows
      continue
    }
    if (-not ($xml.worksheet.sheetData.PSObject.Properties.Name -contains "row")) {
      $sheets[$name] = $rows
      continue
    }
    foreach ($r in @($xml.worksheet.sheetData.row)) {
      $rowData = @{
        RowNo  = [int]$r.r
        Cells  = @{}
      }
      if (-not ($r.PSObject.Properties.Name -contains "c")) {
        $rows += $rowData
        continue
      }
      foreach ($c in @($r.c)) {
        $ref = [string]$c.r
        if (-not $ref) { continue }
        $col = ($ref -replace "\d", "")
        $rowData.Cells[$col] = (CellToValue $c $shared)
      }
      $rows += $rowData
    }
    $sheets[$name] = $rows
  }

  $zip.Dispose()
  $fs.Dispose()
  return @{
    Sheets = $sheets
    SheetOrder = $sheetOrder
  }
}

function Is-Noisy-SheetName {
  param([string]$SheetName)
  $n = (Normalize-Text $SheetName).ToLowerInvariant()
  if (-not $n) { return $true }
  if ($n -eq "system.xml.xmlelement") { return $true }
  if ($n -match "^(sheet no\.?|s\.?no\.?)$") { return $true }
  if ($n -match "^\d+(\.\d+)?$") { return $true }
  return $false
}

function Find-HeaderMap {
  param([object[]]$Rows)
  foreach ($r in $Rows) {
    $kv = $r.Cells
    $brandCol = $null
    $productCol = $null
    $modelCol = $null
    $saleCol = $null
    $siteStatusCol = $null

    foreach ($k in $kv.Keys) {
      $v = (Normalize-Text ([string]$kv[$k])).ToLowerInvariant()
      if ($v -eq "brand") { $brandCol = $k }
      elseif ($v -eq "product") { $productCol = $k }
      elseif ($v -match "model no|model") { $modelCol = $k }
      elseif ($v -match "sale price") { $saleCol = $k }
      elseif ($v -match "site status") { $siteStatusCol = $k }
    }

    if ($brandCol -and $productCol -and $modelCol) {
      return @{
        HeaderRow    = $r.RowNo
        BrandCol     = $brandCol
        ProductCol   = $productCol
        ModelCol     = $modelCol
        SaleCol      = $saleCol
        SiteStatusCol = $siteStatusCol
      }
    }
  }
  return $null
}

function Find-ClientProjectsColumns {
  param([object[]]$Rows)
  $fallback = @{
    SheetCol = "A"
    ClientCol = "C"
    LocationCol = "D"
    DriveCol = "E"
  }
  foreach ($r in $Rows | Select-Object -First 8) {
    $sheetCol = $null
    $sheetNoCol = $null
    $projectNameCol = $null
    $clientCol = $null
    $locationCol = $null
    $driveCol = $null
    foreach ($k in $r.Cells.Keys) {
      $v = (Normalize-Text ([string]$r.Cells[$k])).ToLowerInvariant()
      if (-not $v) { continue }
      if ($v -match "^sheet\s*no\.?$" -or $v -match "^s\.?no\.?$") { $sheetNoCol = $k; continue }
      if (-not $projectNameCol -and ($v -match "project name" -or $v -match "sheet name" -or $v -match "^project$")) { $projectNameCol = $k; continue }
      if (-not $sheetCol -and ($v -match "sheet" -or $v -match "project")) { $sheetCol = $k; continue }
      if (-not $clientCol -and ($v -match "client")) { $clientCol = $k; continue }
      if (-not $locationCol -and ($v -match "location" -or $v -match "site")) { $locationCol = $k; continue }
      if (-not $driveCol -and ($v -match "drive" -or $v -match "gdrive" -or $v -match "google")) { $driveCol = $k; continue }
    }
    if ($sheetCol -or $projectNameCol) {
      $resolvedSheetCol = $sheetCol
      if ($projectNameCol) { $resolvedSheetCol = $projectNameCol }
      return @{
        SheetCol = $resolvedSheetCol
        SheetNoCol = $sheetNoCol
        ProjectNameCol = $projectNameCol
        ClientCol = $(if ($clientCol) { $clientCol } else { $fallback.ClientCol })
        LocationCol = $(if ($locationCol) { $locationCol } else { $fallback.LocationCol })
        DriveCol = $(if ($driveCol) { $driveCol } else { $fallback.DriveCol })
        HeaderRow = $r.RowNo
      }
    }
  }
  return $fallback
}

Write-Host "Logging in..."
$adminToken = Login -Email $AdminEmail -Password $AdminPassword
$approverToken = $null
if (-not $IsDryRun) {
  $approverToken = Login -Email $ApproverEmail -Password $ApproverPassword
}

Write-Host "Loading workbook: $ExcelPath"
$workbook = Get-XlsxWorkbookData -Path $ExcelPath
$sheets = $workbook.Sheets
$sheetOrder = @($workbook.SheetOrder)
$sheetNameByKey = @{}
foreach ($sn in $sheets.Keys) {
  $sheetNameByKey[(Normalize-Key $sn)] = $sn
}
$masterSheets = @($sheetOrder | Select-Object -First 3)
$masterSheetLookup = @{}
foreach ($ms in $masterSheets) {
  $masterSheetLookup[(Normalize-Key $ms)] = $true
}
Write-Host ("Master sheets detected: " + ($masterSheets -join ", "))

if (-not $sheets.ContainsKey("ClientProjects List")) {
  throw "ClientProjects List sheet not found."
}
if (-not $sheets.ContainsKey("Client-Mas-Names")) {
  Write-Host "Warning: Client-Mas-Names sheet not found."
}

# Existing master caches
$categories = As-List (Invoke-JsonApi -Method "GET" -Url "$ApiBase/admin/categories" -Token $adminToken)
$productTypes = As-List (Invoke-JsonApi -Method "GET" -Url "$ApiBase/admin/product-types" -Token $adminToken)
$brands = As-List (Invoke-JsonApi -Method "GET" -Url "$ApiBase/admin/brands" -Token $adminToken)
$items = As-List (Invoke-JsonApi -Method "GET" -Url "$ApiBase/admin/items" -Token $adminToken)
$projects = As-List (Invoke-JsonApi -Method "GET" -Url "$ApiBase/projects" -Token $adminToken)
$clients = As-List (Invoke-JsonApi -Method "GET" -Url "$ApiBase/clients" -Token $adminToken)

foreach ($payload in @($categories, $productTypes, $brands, $items, $projects, $clients)) {
  $arr = @((As-List $payload))
  $len = @($arr).Length
  if ($len -eq 1 -and (Has-Prop $arr[0] "error")) {
    throw ("API returned error payload: " + $arr[0].error)
  }
}

$category = $categories | Where-Object { (Has-Prop $_ "name") -and $_.name -eq $DefaultCategoryName } | Select-Object -First 1
if (-not $category) {
  if ($IsDryRun) {
    $category = @{ id = [guid]::NewGuid().ToString(); name = $DefaultCategoryName; sequence_order = 999; is_active = $true }
  } else {
    $category = Invoke-JsonApi -Method "POST" -Url "$ApiBase/admin/categories" -Token $adminToken -Body @{
      name = $DefaultCategoryName
      sequenceOrder = 999
      isActive = $true
    }
    Write-Host "Created category: $DefaultCategoryName"
  }
  $summary.created.categories++
}

$categoryId = $category.id
$ptByName = @{}
foreach ($pt in $productTypes) {
  if ((Has-Prop $pt "category_id") -and (Has-Prop $pt "name") -and $pt.category_id -eq $categoryId) {
    $ptByName[(Normalize-Text $pt.name).ToLowerInvariant()] = $pt
  }
}
$brandByName = @{}
foreach ($b in $brands) {
  if (Has-Prop $b "name") { $brandByName[(Normalize-Text $b.name).ToLowerInvariant()] = $b }
}
$itemByKey = @{}
foreach ($it in $items) {
  if ((Has-Prop $it "brand_name") -and (Has-Prop $it "product_type_name") -and (Has-Prop $it "model_number")) {
    $k = ((Normalize-Text $it.brand_name).ToLowerInvariant() + "|" + (Normalize-Text $it.product_type_name).ToLowerInvariant() + "|" + (Normalize-Text $it.model_number).ToLowerInvariant())
    $itemByKey[$k] = $it
  }
}
$projectByName = @{}
foreach ($p in $projects) {
  if (Has-Prop $p "name") { $projectByName[(Normalize-Text $p.name).ToLowerInvariant()] = $p }
}
$clientByName = @{}
foreach ($c in $clients) {
  if (Has-Prop $c "name") {
    $clientByName[(Normalize-Text $c.name).ToLowerInvariant()] = $c
  }
}

function Ensure-Client([string]$name, [string]$location) {
  $n = Normalize-Text $name
  if (-not $n) { return $null }
  $n = Sanitize-EntityName -Value $n -Fallback "Unknown Client"
  $key = $n.ToLowerInvariant()
  if ($clientByName.ContainsKey($key)) { return $clientByName[$key] }
  $loc = Normalize-Text $location
  if ($IsDryRun) {
    $c = @{
      id = [guid]::NewGuid().ToString()
      name = $n
      location = $loc
      is_active = $true
    }
  } else {
    $c = Invoke-JsonApi -Method "POST" -Url "$ApiBase/clients" -Token $adminToken -Body @{
      name = $n
      location = $(if ($loc) { $loc } else { "" })
      isActive = $true
    }
  }
  $summary.created.clients++
  $clientByName[$key] = $c
  return $c
}

function Ensure-ProductType([string]$name) {
  $n = (Normalize-Text $name)
  if (-not (Is-MeaningfulValue $n)) { $n = "Unknown Product" }
  $n = Sanitize-EntityName -Value $n -Fallback "Unknown Product"
  $key = $n.ToLowerInvariant()
  if ($ptByName.ContainsKey($key)) { return $ptByName[$key] }
  if ($IsDryRun) {
    $pt = @{ id = [guid]::NewGuid().ToString(); category_id = $categoryId; name = $n; is_active = $true }
  } else {
    try {
      $pt = Invoke-JsonApi -Method "POST" -Url "$ApiBase/admin/product-types" -Token $adminToken -Body @{
        categoryId = $categoryId
        name = $n
        isActive = $true
      }
    } catch {
      # Fallback retry for dirty excel strings that fail validation/parsing
      $safe = Sanitize-EntityName -Value $n -Fallback "Unknown Product"
      if ($safe -ne $n) {
        $pt = Invoke-JsonApi -Method "POST" -Url "$ApiBase/admin/product-types" -Token $adminToken -Body @{
          categoryId = $categoryId
          name = $safe
          isActive = $true
        }
        $n = $safe
      } else {
        throw
      }
    }
  }
  $summary.created.productTypes++
  $ptByName[$key] = $pt
  return $pt
}

function Ensure-Brand([string]$name) {
  $n = (Normalize-Text $name)
  if (-not (Is-MeaningfulValue $n)) { $n = "Unknown Brand" }
  $n = Sanitize-EntityName -Value $n -Fallback "Unknown Brand"
  $key = $n.ToLowerInvariant()
  if ($brandByName.ContainsKey($key)) { return $brandByName[$key] }
  if ($IsDryRun) {
    $b = @{ id = [guid]::NewGuid().ToString(); name = $n; is_active = $true }
  } else {
    try {
      $b = Invoke-JsonApi -Method "POST" -Url "$ApiBase/admin/brands" -Token $adminToken -Body @{
        name = $n
        isActive = $true
      }
    } catch {
      $safe = Sanitize-EntityName -Value $n -Fallback "Unknown Brand"
      if ($safe -ne $n) {
        $b = Invoke-JsonApi -Method "POST" -Url "$ApiBase/admin/brands" -Token $adminToken -Body @{
          name = $safe
          isActive = $true
        }
        $n = $safe
      } else {
        throw
      }
    }
  }
  $summary.created.brands++
  $brandByName[$key] = $b
  return $b
}

function Ensure-Item([string]$brandName, [string]$productName, [string]$modelNumber, [double]$rate) {
  $pt = Ensure-ProductType $productName
  $br = Ensure-Brand $brandName

  $model = Normalize-Text $modelNumber
  if (-not $model) { $model = "UNKNOWN-MODEL" }
  $model = Sanitize-EntityName -Value $model -Fallback "UNKNOWN-MODEL"
  $key = ((Normalize-Text $br.name).ToLowerInvariant() + "|" + (Normalize-Text $pt.name).ToLowerInvariant() + "|" + $model.ToLowerInvariant())
  if ($itemByKey.ContainsKey($key)) { return $itemByKey[$key] }

  $fullName = Sanitize-EntityName -Value (((Normalize-Text $br.name) + " " + (Normalize-Text $pt.name) + " " + $model).Trim()) -Fallback $model
  if ($IsDryRun) {
    $item = @{
      id = [guid]::NewGuid().ToString()
      category_id = $categoryId
      product_type_id = $pt.id
      brand_id = $br.id
      model_number = $model
      full_name = $fullName
      default_rate = $rate
      brand_name = $br.name
      product_type_name = $pt.name
    }
  } else {
    $item = Invoke-JsonApi -Method "POST" -Url "$ApiBase/admin/items" -Token $adminToken -Body @{
      categoryId = $categoryId
      productTypeId = $pt.id
      brandId = $br.id
      modelNumber = $model
      fullName = $fullName
      unitOfMeasure = "Nos"
      defaultRate = $rate
      specifications = @{}
      isActive = $true
    }
  }
  $summary.created.items++
  $itemByKey[$key] = $item
  return $item
}

function Ensure-Project([string]$name, [string]$clientName, [string]$location, [string]$driveLink) {
  $n = Normalize-Text $name
  if (-not $n) { return $null }
  $client = Normalize-Text $clientName
  if (-not $client) { $client = $n }
  $loc = Normalize-Text $location
  if (-not $loc) { $loc = "Unknown" }
  $clientEntity = Ensure-Client -name $client -location $loc
  $clientId = $null
  if ($clientEntity -and (Has-Prop $clientEntity "id")) { $clientId = $clientEntity.id }
  $key = $n.ToLowerInvariant()
  $drv = Normalize-UrlOrEmpty $driveLink
  if ($projectByName.ContainsKey($key)) {
    $existing = $projectByName[$key]
    if ((-not $IsDryRun)) {
      $needsUpdate = $true
      $sameDrive = ((Has-Prop $existing "drive_link") -and ($existing.drive_link -eq $drv))
      $sameClient = $true
      if ($clientId) {
        $sameClient = ((Has-Prop $existing "client_id") -and ($existing.client_id -eq $clientId))
      }
      if ($sameDrive -and $sameClient) {
        $needsUpdate = $false
      }
      if ($needsUpdate) {
        $patch = @{}
        if ($drv) { $patch.driveLink = $drv }
        if ($clientId) { $patch.clientId = $clientId; $patch.clientName = $client }
        if (@($patch.Keys).Count -gt 0) {
          $updated = Invoke-JsonApi -Method "PATCH" -Url "$ApiBase/projects/$($existing.id)" -Token $adminToken -Body $patch
        } else {
          $updated = $existing
        }
        $projectByName[$key] = $updated
        return $updated
      }
    }
    return $existing
  }

  if ($IsDryRun) {
    $p = @{ id = [guid]::NewGuid().ToString(); name = $n; client_id = $clientId; client_name = $client; location = $loc; drive_link = $drv }
  } else {
      $projectPayload = @{
      name = $n
      clientName = $client
      location = $loc
      categorySequenceMode = $false
      engineerIds = @()
      }
      if ($clientId) { $projectPayload.clientId = $clientId }
      if ($drv) { $projectPayload.driveLink = $drv }
      $p = Invoke-JsonApi -Method "POST" -Url "$ApiBase/projects" -Token $adminToken -Body $projectPayload
  }
  $summary.created.projects++
  $projectByName[$key] = $p
  return $p
}

function Import-ProjectSheet {
  param(
    [string]$SheetName,
    [string]$ClientName,
    [string]$Location,
    [string]$DriveLink
  )
  $resolvedName = $SheetName
  if (-not $sheets.ContainsKey($resolvedName)) {
    $k = Normalize-Key $SheetName
    if ($sheetNameByKey.ContainsKey($k)) {
      $resolvedName = $sheetNameByKey[$k]
    }
  }
  if (-not $sheets.ContainsKey($resolvedName)) {
    Write-Host "Skip: sheet not found -> $SheetName"
    return
  }
  $rows = $sheets[$resolvedName]
  $header = Find-HeaderMap -Rows $rows
  if (-not $header) {
    Write-Host "Skip: no Brand/Product/Model header -> $resolvedName"
    return
  }

  $project = Ensure-Project -name $resolvedName -clientName $ClientName -location $Location -driveLink $DriveLink
  if (-not $project) { return }

  if (-not $IsDryRun) {
    $existingCRs = @(Invoke-JsonApi -Method "GET" -Url "$ApiBase/projects/$($project.id)/change-requests" -Token $adminToken)
    $open = $existingCRs | Where-Object { ($_.PSObject.Properties.Name -contains "status") -and ($_.status -in @("draft", "pending")) } | Select-Object -First 1
    if ($open) {
      Write-Host "Skip: open CR exists -> $resolvedName"
      $summary.projectsSkipped++
      return
    }
  }

  $agg = @{}
  foreach ($r in $rows) {
    if ($r.RowNo -le [int]$header.HeaderRow) { continue }
    $brand = Normalize-Text ([string]$r.Cells[$header.BrandCol])
    $product = Normalize-Text ([string]$r.Cells[$header.ProductCol])
    $model = Normalize-Text ([string]$r.Cells[$header.ModelCol])
    if (-not $brand -and -not $product -and -not $model) { continue }
    if (-not (Is-MeaningfulValue $product)) { continue }
    if (-not (Is-MeaningfulValue $brand)) { $brand = "Unknown Brand" }
    if (-not (Is-MeaningfulValue $model)) { $model = "UNKNOWN-MODEL" }

    $rate = 0
    if ($header.SaleCol) { $rate = Parse-Number ([string]$r.Cells[$header.SaleCol]) }
    $siteStatus = ""
    if ($header.SiteStatusCol) { $siteStatus = [string]$r.Cells[$header.SiteStatusCol] }
    $mappedStatus = Map-SiteStatus $siteStatus

    $k = ($brand.ToLowerInvariant() + "|" + $product.ToLowerInvariant() + "|" + $model.ToLowerInvariant())
    if (-not $agg.ContainsKey($k)) {
      $agg[$k] = @{
        Brand = $brand
        Product = $product
        Model = $model
        Qty = 0
        Rate = $rate
        Status = $mappedStatus
      }
    }
    $agg[$k].Qty = [double]$agg[$k].Qty + 1
    if ($rate -gt 0) { $agg[$k].Rate = $rate }
  }

  if ($agg.Count -eq 0) {
    Write-Host "Skip: no BOM lines -> $resolvedName"
    $summary.projectsSkipped++
    return
  }

  if ($IsDryRun) {
    foreach ($entry in $agg.Values) {
      $null = Ensure-Item -brandName $entry.Brand -productName $entry.Product -modelNumber $entry.Model -rate ([double]$entry.Rate)
      $summary.created.crItems++
    }
    $summary.created.changeRequests++
    $summary.projectsImported++
    Write-Host ("[DRY-RUN] Prepared: " + $resolvedName + " | Models: " + $agg.Count)
    return
  }

  $resolvedItems = @()
  foreach ($entry in $agg.Values) {
    $item = Ensure-Item -brandName $entry.Brand -productName $entry.Product -modelNumber $entry.Model -rate ([double]$entry.Rate)
    $resolvedItems += @{ item = $item; entry = $entry }
  }

  $preDash = Invoke-JsonApi -Method "GET" -Url "$ApiBase/projects/$($project.id)/dashboard" -Token $adminToken
  $liveBomByItem = @{}
  foreach ($bi in @($preDash.bom)) { $liveBomByItem[$bi.item_id] = $bi }

  $cr = Invoke-JsonApi -Method "POST" -Url "$ApiBase/projects/$($project.id)/change-requests" -Token $adminToken -Body @{}
  $summary.created.changeRequests++
  try {
    foreach ($ri in $resolvedItems) {
      $item = $ri.item
      $entry = $ri.entry
      $changeType = "add"
      $oldQty = $null
      $newQty = [double]$entry.Qty
      if ($liveBomByItem.ContainsKey($item.id)) {
        $changeType = "modify"
        $oldQty = [double]$liveBomByItem[$item.id].quantity
        $deliveredQty = [double]$liveBomByItem[$item.id].delivered_quantity
        if ($newQty -lt $deliveredQty) { $newQty = $deliveredQty }
      }
      Invoke-JsonApi -Method "POST" -Url "$ApiBase/change-requests/$($cr.id)/items" -Token $adminToken -Body @{
        itemId = $item.id
        changeType = $changeType
        newQuantity = $newQty
        oldQuantity = $oldQty
      } | Out-Null
      $summary.created.crItems++
    }
    Invoke-JsonApi -Method "POST" -Url "$ApiBase/change-requests/$($cr.id)/submit" -Token $adminToken -Body @{} | Out-Null
    Invoke-JsonApi -Method "POST" -Url "$ApiBase/change-requests/$($cr.id)/approve" -Token $approverToken -Body @{} | Out-Null
  } catch {
    try {
      Invoke-JsonApi -Method "DELETE" -Url "$ApiBase/change-requests/$($cr.id)" -Token $adminToken | Out-Null
    } catch {}
    throw
  }

  # Apply one representative status per model on live BOM (optional but useful for migrated view)
  $dash = Invoke-JsonApi -Method "GET" -Url "$ApiBase/projects/$($project.id)/dashboard" -Token $adminToken
  $bomByItem = @{}
  foreach ($bi in @($dash.bom)) { $bomByItem[$bi.item_id] = $bi }
  foreach ($entry in $agg.Values) {
    $item = Ensure-Item -brandName $entry.Brand -productName $entry.Product -modelNumber $entry.Model -rate ([double]$entry.Rate)
    if ($bomByItem.ContainsKey($item.id)) {
      $bomId = $bomByItem[$item.id].id
      Invoke-JsonApi -Method "PATCH" -Url "$ApiBase/projects/$($project.id)/bom-items/$bomId/status" -Token $adminToken -Body @{
        status = $entry.Status
      } | Out-Null
    }
  }

  $summary.projectsImported++
  Write-Host ("Imported: " + $resolvedName + " | Models: " + $agg.Count)
}

Write-Host "Reading project rows from ClientProjects List..."
$clientList = $sheets["ClientProjects List"]
$clientCols = Find-ClientProjectsColumns -Rows $clientList
$projectRows = @()
$clientBillingByName = @{}
if ($sheets.ContainsKey("Client-Mas-Names")) {
  foreach ($r in $sheets["Client-Mas-Names"]) {
    if ($r.RowNo -eq 1) { continue }
    $client = Normalize-Text ([string]$r.Cells["A"])
    $billing = Normalize-Text ([string]$r.Cells["B"])
    if ($client) {
      $billingValue = $client
      if ($billing) { $billingValue = $billing }
      $clientBillingByName[$client.ToLowerInvariant()] = $billingValue
    }
  }
}
foreach ($r in $clientList) {
  if ((Has-Prop $clientCols "HeaderRow") -and $r.RowNo -eq [int]$clientCols.HeaderRow) { continue }
  $sheetName = Normalize-Text ([string]$r.Cells[$clientCols.SheetCol])
  $sheetNo = ""
  if ((Has-Prop $clientCols "SheetNoCol") -and $clientCols.SheetNoCol) {
    $sheetNo = Normalize-Text ([string]$r.Cells[$clientCols.SheetNoCol])
  }
  $clientName = Normalize-Text ([string]$r.Cells[$clientCols.ClientCol])
  $location = Normalize-Text ([string]$r.Cells[$clientCols.LocationCol])
  $driveLink = Normalize-UrlOrEmpty ([string]$r.Cells[$clientCols.DriveCol])
  if ($clientBillingByName.ContainsKey($clientName.ToLowerInvariant())) {
    $clientName = $clientBillingByName[$clientName.ToLowerInvariant()]
  }
  if (-not $sheetName) { continue }
  if (Is-Noisy-SheetName $sheetName) { continue }
  if ($sheetNo -and $sheetNo -eq $sheetName) { continue }
  # Strict rule: first 3 sheets are master sheets and never imported as project sheets.
  if ($masterSheetLookup.ContainsKey((Normalize-Key $sheetName))) { continue }
  $projectRows += @{
    SheetName = $sheetName
    ClientName = $clientName
    Location = $location
    DriveLink = $driveLink
  }
}

$seen = @{}
$count = 0
foreach ($p in $projectRows) {
  $summary.projectsSeen++
  $key = $p.SheetName.ToLowerInvariant()
  if ($seen.ContainsKey($key)) { continue }
  $seen[$key] = $true
  if ($MaxProjects -gt 0 -and $count -ge $MaxProjects) { break }
  try {
    Import-ProjectSheet -SheetName $p.SheetName -ClientName $p.ClientName -Location $p.Location -DriveLink $p.DriveLink
    $count++
  } catch {
    $summary.projectsFailed++
    $summary.failures += ("{0} => {1}" -f $p.SheetName, $_.Exception.Message)
    Write-Host ("Failed: " + $p.SheetName + " -> " + $_.Exception.Message)
  }
}

$summary.endedAt = (Get-Date).ToString("s")
$summary.processedProjects = $count
$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $SummaryPath -Encoding UTF8
Write-Host ("Summary written: " + (Resolve-Path $SummaryPath))
Write-Host ("Done. Processed projects: " + $count)
