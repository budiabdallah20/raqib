@echo off
rem رقيب — تشغيل الموقع الحي مع الإصلاح الفوري (Hot Reload)
rem سيرفر موحّد: HTTPS على نفس منفذ الإنتاج (5000) بنفس شهادة mkcert،
rem وكل تعديل في الكود يظهر لحظيًا بدون إعادة تشغيل يدوية.
title RAQiB Live Server (Hot Reload :5000)
cd /d "%~dp0"
start "" https://localhost:5000
npm run dev:https
