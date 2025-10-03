@echo off
echo Creating SwansonAI shortcuts...

REM Create shortcut on OneDrive Desktop
copy "c:\Users\lytle\OneDrive\Desktop\SwansonAI\Launch-SwansonAI-Enhanced.bat" "%userprofile%\OneDrive\Desktop\SwansonAI-Launch.bat" >nul 2>&1

REM Create shortcut on regular Desktop (if different)
copy "c:\Users\lytle\OneDrive\Desktop\SwansonAI\Launch-SwansonAI-Enhanced.bat" "%userprofile%\Desktop\SwansonAI-Launch.bat" >nul 2>&1

REM Create a simple launcher in the project folder that can be pinned to taskbar
echo @echo off > SwansonAI-QuickLaunch.bat
echo cd /d "c:\Users\lytle\OneDrive\Desktop\SwansonAI" >> SwansonAI-QuickLaunch.bat
echo start "" "Launch-SwansonAI-Enhanced.bat" >> SwansonAI-QuickLaunch.bat

echo.
echo ✅ SwansonAI shortcuts created!
echo.
echo You can now:
echo 1. Use SwansonAI-Launch.bat on your Desktop
echo 2. Pin SwansonAI-QuickLaunch.bat to your taskbar
echo 3. Double-click Launch-SwansonAI-Enhanced.bat directly
echo.
pause