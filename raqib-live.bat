@echo off
rem رقيب — تشغيل الموقع الحي مع الإصلاح الفوري (Hot Reload)
rem كل تعديل تسمعه على طول في المتصفح، والأخطاء تظهر لحظيًا على الشاشة.
title RAQiB Live Server (Turbopack)
cd /d "%~dp0"
start "" http://localhost:3000
npm run dev
