# PowerShell script to export WebHoaTuoiDb data to sql_data/webhoatuoidb_data.sql
$connString = "Server=localhost\SQLEXPRESS;Database=WebHoaTuoiDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()

# Tables in dependency order (parent tables first)
$tables = @(
    "AspNetRoles",
    "AspNetUsers",
    "AspNetUserRoles",
    "Categories",
    "Products",
    "Orders",
    "OrderItems",
    "Reviews",
    "SystemSettings",
    "Vouchers",
    "BlogPosts"
)

$outputPath = Join-Path $PSScriptRoot "webhoatuoidb_data.sql"
$writer = New-Object System.IO.StreamWriter($outputPath, $false, [System.Text.Encoding]::UTF8)

$writer.WriteLine("-- WebHoaTuoiDb Data Export")
$writer.WriteLine("-- Generated at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$writer.WriteLine("USE [WebHoaTuoiDb];")
$writer.WriteLine("GO")
$writer.WriteLine("")

# Get identity columns for each table
function Get-IdentityColumn($tableName) {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name FROM sys.identity_columns WHERE object_id = OBJECT_ID('$tableName')"
    $res = $cmd.ExecuteScalar()
    return $res
}

foreach ($table in $tables) {
    Write-Host "Exporting table: $table"
    
    $identityCol = Get-IdentityColumn $table
    $hasIdentity = $identityCol -ne $null
    
    if ($hasIdentity) {
        $writer.WriteLine("SET IDENTITY_INSERT [$table] ON;")
        $writer.WriteLine("GO")
    }

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT * FROM [$table]"
    $reader = $cmd.ExecuteReader()
    
    # Get columns metadata
    $schemaTable = $reader.GetSchemaTable()
    $columns = @()
    foreach ($row in $schemaTable.Rows) {
        $columns += [PSCustomObject]@{
            Name = $row["ColumnName"]
            DataType = $row["DataType"]
            IsIdentity = $row["IsIdentity"]
        }
    }
    
    $colListStr = ($columns | ForEach-Object { "[$($_.Name)]" }) -join ", "
    
    $rowCount = 0
    while ($reader.Read()) {
        $values = @()
        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
            $val = $reader.GetValue($i)
            $col = $columns[$i]
            
            if ($reader.IsDBNull($i)) {
                $values += "NULL"
            } elseif ($col.DataType -eq [System.Boolean]) {
                if ($val) { $values += "1" } else { $values += "0" }
            } elseif ($col.DataType -eq [System.DateTime] -or $col.DataType -eq [System.DateTimeOffset]) {
                $dtStr = [DateTime]$val
                $values += "N'$($dtStr.ToString('yyyy-MM-dd HH:mm:ss.fff'))'"
            } elseif ($col.DataType -eq [System.String] -or $col.DataType -eq [System.Guid]) {
                $escaped = $val.ToString().Replace("'", "''")
                $values += "N'$escaped'"
            } elseif ($col.DataType -in @([System.Decimal], [System.Double], [System.Single], [System.Int32], [System.Int64], [System.Int16], [System.Byte])) {
                $values += $val.ToString().Replace(",", ".") # Safe decimal format
            } else {
                $escaped = $val.ToString().Replace("'", "''")
                $values += "N'$escaped'"
            }
        }
        
        $valListStr = $values -join ", "
        $writer.WriteLine("INSERT INTO [$table] ($colListStr) VALUES ($valListStr);")
        $rowCount++
    }
    $reader.Close()
    
    if ($hasIdentity) {
        $writer.WriteLine("SET IDENTITY_INSERT [$table] OFF;")
        $writer.WriteLine("GO")
    }
    $writer.WriteLine("")
    Write-Host "Exported $rowCount rows."
}

$writer.Close()
$conn.Close()
Write-Host "Export completed successfully! Saved to: $outputPath"
