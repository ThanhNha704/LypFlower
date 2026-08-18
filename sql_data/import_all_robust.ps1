# import_all_robust.ps1
# Robust SQL Import Script for WebHoaTuoiDb and FlowerDW

$ErrorActionPreference = "Stop"

# Target Server & Databases
$sqlServer = "localhost\SQLEXPRESS"
$databases = @("WebHoaTuoiDb", "FlowerDW")

# File Paths
$sqlSourceDir = Join-Path $PSScriptRoot "sql_source"
$files = [ordered]@{
    "USER"         = Join-Path $sqlSourceDir "USER.sql"
    "Orders"       = Join-Path $sqlSourceDir "Orders.sql"
    "OrderDetails" = Join-Path $sqlSourceDir "OrderDetails.sql"
    "Reviews"      = Join-Path $sqlSourceDir "Reviews.sql"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Robust SQL Server Data Importer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

foreach ($db in $databases) {
    Write-Host "Processing Database: ${db}..." -ForegroundColor Yellow
    
    # Check if database exists
    $dbExistsResult = sqlcmd -S $sqlServer -Q "SELECT COUNT(*) FROM sys.databases WHERE name = '$db'" -h -1
    $dbExists = $dbExistsResult[0].Trim()
    if ($dbExists -eq "0") {
        Write-Warning "Database ${db} does not exist. Skipping."
        continue
    }

    # Disable check constraints
    Write-Host "  Disabling foreign key constraints in ${db}..."
    sqlcmd -S $sqlServer -d $db -Q "EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';" | Out-Null

    # Clean existing data in dependency order
    Write-Host "  Cleaning existing data in ${db} (Reviews -> OrderDetails -> Orders -> USER)..."
    sqlcmd -S $sqlServer -d $db -Q "DELETE FROM Reviews; DELETE FROM OrderDetails; DELETE FROM Orders; DELETE FROM [USER];" | Out-Null

    foreach ($table in $files.Keys) {
        $filePath = $files[$table]
        if (-not (Test-Path $filePath)) {
            Write-Warning "  File not found: $filePath. Skipping table $table."
            continue
        }

        Write-Host "  Importing $table into ${db}..."
        
        # Check if table has identity column
        $hasIdentityQuery = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('$table') AND is_identity = 1"
        $hasIdentityResult = sqlcmd -S $sqlServer -d $db -Q $hasIdentityQuery -h -1
        $hasIdentity = ($hasIdentityResult[0].Trim() -eq "1")

        Write-Host "    Table $table has identity column in ${db}: $hasIdentity"

        # Read SQL and preprocess
        $sqlContent = Get-Content -Path $filePath -Raw

        # Common fixes:
        # 1. Replace insert into USER with insert into [USER] (reserved keyword)
        $sqlContent = $sqlContent -replace '(?i)insert into USER\s*\(', 'insert into [USER] ('

        # 2. Handle IDENTITY_INSERT statements based on table identity property in the database
        if ($hasIdentity) {
            # Ensure IDENTITY_INSERT is set to ON for the script execution
            # If the script has SET IDENTITY_INSERT ... ON, keep it, otherwise add it
            if ($sqlContent -notmatch "SET IDENTITY_INSERT\s+\[?$table\]?\s+ON") {
                $sqlContent = "SET IDENTITY_INSERT [$table] ON;`r`nGO`r`n" + $sqlContent + "`r`nSET IDENTITY_INSERT [$table] OFF;`r`nGO"
            }
        } else {
            # Strip out any IDENTITY_INSERT statements as they cause errors when table has no identity columns
            $sqlContent = $sqlContent -replace "(?i)SET IDENTITY_INSERT\s+\[?$table\]?\s+ON;?", ""
            $sqlContent = $sqlContent -replace "(?i)SET IDENTITY_INSERT\s+\[?$table\]?\s+OFF;?", ""
            $sqlContent = $sqlContent -replace "(?i)SET IDENTITY_INSERT\s+\[?Users\]?\s+ON;?", ""
            $sqlContent = $sqlContent -replace "(?i)SET IDENTITY_INSERT\s+\[?Users\]?\s+OFF;?", ""
        }

        # Write to temporary file
        $tempFile = Join-Path $env:TEMP ("temp_import_" + $table + "_" + $db + ".sql")
        Set-Content -Path $tempFile -Value $sqlContent -Encoding utf8

        # Run import
        $importOutput = sqlcmd -S $sqlServer -d $db -i $tempFile 2>&1
        $importFailed = $LASTEXITCODE -ne 0

        # Clean up temp file
        if (Test-Path $tempFile) {
            Remove-Item -Path $tempFile -Force
        }

        if ($importFailed) {
            Write-Error "    Import failed for table $table in database ${db}. Output: $importOutput"
        } else {
            Write-Host "    Import successful for table $table."
        }
    }

    # Enable check constraints
    Write-Host "  Re-enabling check constraints in ${db}..."
    sqlcmd -S $sqlServer -d $db -Q "EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT all';" | Out-Null
    Write-Host "  Database ${db} processing complete.`n" -ForegroundColor Green
}

# Print Row Count Report
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Data Import Row Count Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
foreach ($db in $databases) {
    $dbExistsResult = sqlcmd -S $sqlServer -Q "SELECT COUNT(*) FROM sys.databases WHERE name = '$db'" -h -1
    $dbExists = $dbExistsResult[0].Trim()
    if ($dbExists -eq "0") { continue }

    Write-Host "Database: ${db}" -ForegroundColor Yellow
    $tables = @("USER", "Orders", "OrderDetails", "Reviews")
    foreach ($t in $tables) {
        $countResult = sqlcmd -S $sqlServer -d $db -Q "SELECT COUNT(*) FROM [$t]" -h -1
        $count = $countResult[0].Trim()
        Write-Host "  - Table [$t]: $count rows"
    }
}
Write-Host "==========================================" -ForegroundColor Cyan
