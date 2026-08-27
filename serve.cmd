@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
node tools\serve.mjs
