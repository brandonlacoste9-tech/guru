@echo off
echo Starting GURU Eco-system...

echo Starting Guru Gateway (Port 19789)...
cd guru-gateway
call pnpm start
if %errorlevel% neq 0 (
    echo [WARN] Gateway failed to start via 'pnpm start'. Trying direct tsx...
    npx tsx src/index.ts
)
pause
