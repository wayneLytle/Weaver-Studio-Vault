<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🧠 SwansonAI - Multi-Agent Data Analysis Workspace

> **Intelligent data analysis powered by orchestrated AI agents**

SwansonAI is a sophisticated, human-in-the-loop data analysis studio that leverages multiple specialized AI agents to explore, analyze, and generate insights from datasets—especially BigQuery tables—through natural language interaction.

![SwansonAI Interface](https://img.shields.io/badge/UI-Dark%20Theme-blue) ![Node.js](https://img.shields.io/badge/Node.js-Backend-green) ![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT-orange) ![BigQuery](https://img.shields.io/badge/Data-BigQuery-yellow)

## 🚀 Features

### 🤖 Multi-Agent Architecture
- **J.B.** 🧠 - Interface Agent & Orchestrator
- **QuerySynth** 🔍 - SQL Generator for BigQuery
- **InsightMiner** 💎 - Statistical Analysis & EDA Specialist  
- **VizCrafter** 📊 - Visualization Agent
- **ReportSmith** 📄 - PDF Report Generator

### 🚀 Multi-Model AI Support
- **OpenAI Models**: GPT-4O, GPT-4O Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Google Gemini Models**: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash, Gemini 1.5 Pro/Flash
- **Workload Identity Federation** for secure Google Cloud access
- **Real-time model switching** in the chat interface

### 💬 World-Class Chat Interface
- ✅ **Real-time streaming** responses
- ✅ **File upload** (CSV, JSON, Excel) via drag & drop
- ✅ **Copy/paste** support with clipboard integration
- ✅ **Download** responses and data exports
- ✅ **Keyboard shortcuts** (Ctrl+Enter to send)
- ✅ **Message actions** (copy, download, regenerate)

### 📊 Advanced Data Analysis
- ✅ **Live BigQuery** integration with metadata
- ✅ **Interactive tables** with sorting and filtering
- ✅ **Automatic insights** generation
- ✅ **Statistical summaries** and anomaly detection
- ✅ **CSV export** and data visualization

### 🎨 Modern UI/UX
- ✅ **Dark theme** with Google design system colors
- ✅ **Agent indicators** showing which AI is responding
- ✅ **Responsive design** for all screen sizes
- ✅ **Micro-interactions** and smooth animations

## 🛠️ Quick Start

### Prerequisites
- Node.js 16+ 
- OpenAI API key
- Google Cloud BigQuery credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SwansonAI.git
   cd SwansonAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_APPLICATION_CREDENTIALS=path_to_your_bigquery_credentials.json
   PORT=3001
   ```

4. **Start the application**
   
   **Option A: One-click launcher**
   ```bash
   # Windows
   .\RUN.bat
   
   # Or use the enhanced launcher
   .\Launch-SwansonAI-Enhanced.bat
   ```
   
   **Option B: Manual start**
   ```bash
   npm start
   # or
   node backend.js
   ```

5. **Open your browser**
   - Main App: http://localhost:3001
   - API Tester: http://localhost:3001/test

## 📖 Usage Examples

### Natural Language to SQL
```
User: "Show me the top 10 customers by revenue this year"
QuerySynth: Generates optimized BigQuery SQL
Result: Interactive table with insights
```

### Data Analysis
```
User: "Analyze this sales dataset for trends"
InsightMiner: Performs statistical analysis
Result: Insights, anomalies, and recommendations
```

### File Upload Analysis
```
User: [Uploads CSV file]
J.B.: Processes file and provides analysis options
InsightMiner: Generates comprehensive data summary
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   AI Agents     │
│                 │    │                  │    │                 │
│ • React/TS      │◄──►│ • Express.js     │◄──►│ • OpenAI GPT    │
│ • Dark UI       │    │ • WebSocket      │    │ • Multi-Agent   │
│ • File Upload   │    │ • BigQuery       │    │ • Streaming     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main chat application |
| `/test` | GET | API testing interface |
| `/api/chat` | POST | Multi-agent chat with streaming |
| `/api/bigquery` | POST | Enhanced BigQuery with metadata |
| `/api/agents` | GET | Available agents information |
| `/api/openai/models` | GET | Available OpenAI models |
| `/api/upload` | POST | File upload processing |

## 🔐 Security & Best Practices

- ✅ **Environment variables** for all sensitive data
- ✅ **API key validation** and error handling
- ✅ **Input sanitization** for SQL injection prevention
- ✅ **.gitignore** configured to exclude credentials
- ✅ **CORS protection** and rate limiting ready

## 📂 Project Structure

```
SwansonAI/
├── backend.js              # Express server with multi-agent system
├── index.html              # Main application UI
├── index.tsx               # Frontend TypeScript logic
├── index.css               # Dark theme styling
├── test-api.html           # API testing interface
├── package.json            # Dependencies and scripts
├── .env.example            # Environment template
├── .gitignore              # Git exclusions
├── RUN.bat                 # One-click launcher (Windows)
└── README.md               # This file
```

## 🎯 Roadmap

- [ ] **Chart.js integration** for advanced visualizations
- [ ] **PDF report generation** with ReportSmith
- [ ] **Real-time collaboration** features
- [ ] **Custom BigQuery connectors** for multiple projects
- [ ] **Advanced statistical analysis** with R/Python integration
- [ ] **Automated testing** suite
- [ ] **Docker containerization**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models and API
- Google Cloud for BigQuery integration
- The open-source community for inspiration

## 📞 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/SwansonAI/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/YOUR_USERNAME/SwansonAI/discussions)

---

**Built with ❤️ for the data science community**
