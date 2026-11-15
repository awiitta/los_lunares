@echo off
cd /d "%~dp0"
start "" http://127.0.0.1:8884/minijuego/descenso.html
python -m http.server 8884 --bind 127.0.0.1 --directory dist
pause
