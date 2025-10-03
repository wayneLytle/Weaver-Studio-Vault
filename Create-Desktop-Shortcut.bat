@echo off
echo Creating desktop shortcut for SwansonAI...

set "targetPath=c:\Users\lytle\OneDrive\Desktop\SwansonAI\Launch-SwansonAI-Enhanced.bat"
set "shortcutPath=%userprofile%\OneDrive\Desktop\SwansonAI.lnk"

REM Try OneDrive Desktop first
powershell -Command "try { $WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = '%targetPath%'; $Shortcut.WorkingDirectory = 'c:\Users\lytle\OneDrive\Desktop\SwansonAI'; $Shortcut.Description = 'Launch SwansonAI Backend'; $Shortcut.Save(); Write-Host 'Shortcut created on OneDrive Desktop' } catch { Write-Host 'OneDrive Desktop failed, trying local Desktop...' }"

REM If OneDrive fails, try local Desktop
if not exist "%userprofile%\OneDrive\Desktop\SwansonAI.lnk" (
    set "shortcutPath=%userprofile%\Desktop\SwansonAI.lnk"
    powershell -Command "try { $WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = '%targetPath%'; $Shortcut.WorkingDirectory = 'c:\Users\lytle\OneDrive\Desktop\SwansonAI'; $Shortcut.Description = 'Launch SwansonAI Backend'; $Shortcut.Save(); Write-Host 'Shortcut created on local Desktop' } catch { Write-Host 'Failed to create shortcut' }"
)

echo Desktop shortcut creation attempted!
pause