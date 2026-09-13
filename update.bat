@echo off
echo Saving and committing local changes...
git add .
git commit -m "quick update"

echo Pulling latest changes from GitHub...
git pull origin main --rebase

echo Pushing to live app...
git push origin main

echo Done! Your app is updating on Vercel.
pause