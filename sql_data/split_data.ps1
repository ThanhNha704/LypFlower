$lines_array = Get-Content -Path "webhoatuoidb_data.sql" -Encoding utf8

if (-not (Test-Path "split_tables")) {
    New-Item -ItemType Directory -Path "split_tables" | Out-Null
}

function Save-Lines($filename, $startIdx, $endIdx) {
    # startIdx and endIdx are 0-based index of array (1-based line number minus 1)
    $sub = $lines_array[$startIdx..$endIdx]
    $content = "-- File: $filename`r`n`r`n" + ($sub -join "`r`n")
    $content | Out-File -FilePath "split_tables\$filename" -Encoding utf8
    Write-Host "Created $filename with $( $sub.Count ) lines."
}

Save-Lines "01_AspNetRoles.sql" 5 8
Save-Lines "02_AspNetUsers.sql" 9 310
Save-Lines "03_AspNetUserRoles.sql" 311 322
Save-Lines "04_Categories.sql" 323 377
Save-Lines "05_Products.sql" 378 432
Save-Lines "06_Orders.sql" 433 1437
Save-Lines "07_OrderItems.sql" 1438 2443
Save-Lines "08_Reviews.sql" 2444 2648
Save-Lines "09_SystemSettings.sql" 2649 2657
Save-Lines "10_Vouchers.sql" 2658 2662
Save-Lines "11_BlogPosts.sql" 2663 2668
