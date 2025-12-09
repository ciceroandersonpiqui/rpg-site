@echo off
cd /d C:\Users\User\Desktop\rpg\serverFirebase

echo ============================================
echo Iniciando atualização do RPG no GitHub...
echo ============================================

git add -A
git commit -m "atualizacao automatica"
git push origin main

echo ============================================
echo Deploy enviado! Verifique no GitHub Actions.
echo ============================================
pause