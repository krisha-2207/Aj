@echo off
echo Starting local PostgreSQL on port 5433...
"C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "%~dp0data" -l "%~dp0postgres.log" start
echo PostgreSQL started on port 5433.
