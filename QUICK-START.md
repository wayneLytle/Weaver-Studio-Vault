# 🚀 SwansonAI - Quick Start Guide

## How to Launch Your App

### Option 1: Desktop Shortcut ⭐ **Easiest**
- Look for `SwansonAI-Launch.bat` on your Desktop
- Double-click to start

### Option 2: Enhanced Launcher ⭐ **Recommended**
- Double-click `Launch-SwansonAI-Enhanced.bat` in this folder
- Includes health checks and auto-setup

### Option 3: Quick Launch
- Double-click `SwansonAI-QuickLaunch.bat` in this folder
- Or pin it to your taskbar for one-click access

### Option 4: Command Line
```bash
npm start
```

## 🌐 Access Your Applications

Once launched, your server runs at: **http://localhost:3001**

- **J.B. Chat App**: http://localhost:3001 (Main Application)
- **API Tester**: http://localhost:3001/test (Developer Tools)
- **Server Status**: http://localhost:3001/api/status
- **OpenAI Endpoint**: POST http://localhost:3001/openai
- **BigQuery Endpoint**: POST http://localhost:3001/bigquery

## 🔧 Configuration

Your API keys are stored in `.env`:
- ✅ OpenAI API Key: Configured
- ✅ BigQuery Credentials: Configured

## 📱 Using Your Applications

### J.B. Chat Application (Main App)
Open http://localhost:3001 in your browser to:
- Chat with J.B., your AI data analysis assistant
- Upload files for analysis
- Get insights from your data
- Modern dark theme interface

### API Tester (Developer Tools)
Open http://localhost:3001/test in your browser to:
- Test OpenAI with custom prompts
- Test BigQuery with SQL queries
- Check server connectivity
- Debug API responses

## 🛑 Stopping the Server

Press `Ctrl + C` in the terminal window to stop the server.

---
*Your SwansonAI backend is ready to use! 🎉*