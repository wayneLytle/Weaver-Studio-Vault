cd 'c:\Users\lytle\OneDrive\Desktop\Weavers Studio Entry'
$ts = (Get-Date -Format yyyyMMdd-HHmmss)
$dest = "C:\Users\lytle\WeaverStudio-Backup-$ts.zip"
Compress-Archive -Path * -DestinationPath $dest
Write-Output "Backup created: $dest"
