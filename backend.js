const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const { OpenAI } = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Initialize services
const bigquery = new BigQuery();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-api.html'));
});

app.get('/api-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-api.html'));
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running', 
    message: 'SwansonAI Backend is operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      main: '/',
      apiTester: '/test',
      openai: '/openai',
      bigquery: '/bigquery'
    }
  });
});

// OpenAI models endpoint
app.get('/api/openai/models', async (req, res) => {
  try {
    const models = await openai.models.list();
    res.json({ 
      models: models.data.map(model => ({
        id: model.id,
        created: model.created,
        object: model.object,
        owned_by: model.owned_by
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Static files - put this after specific routes
app.use(express.static('.'));

// Enhanced BigQuery endpoint with metadata
app.post('/api/bigquery', async (req, res) => {
  try {
    const { query, format = 'json' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('Executing BigQuery:', query);
    const startTime = Date.now();
    
    const [rows] = await bigquery.query({ 
      query,
      dryRun: false,
      useLegacySql: false
    });
    
    const executionTime = Date.now() - startTime;
    
    // Format response with metadata
    const response = {
      data: rows,
      metadata: {
        rowCount: rows.length,
        columnCount: rows.length > 0 ? Object.keys(rows[0]).length : 0,
        executionTimeMs: executionTime,
        query: query,
        timestamp: new Date().toISOString()
      },
      format: format
    };

    res.json(response);
  } catch (error) {
    console.error('BigQuery error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Data analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { data, analysisType = 'basic' } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    const analysis = performDataAnalysis(data, analysisType);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for data analysis
function performDataAnalysis(data, analysisType) {
  if (data.length === 0) {
    return { insights: [], summary: 'No data to analyze' };
  }

  const columns = Object.keys(data[0]);
  const insights = [];
  const summary = {
    totalRows: data.length,
    totalColumns: columns.length,
    columns: {}
  };

  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
    const uniqueValues = [...new Set(values)];
    
    const columnInfo = {
      name: column,
      totalValues: values.length,
      uniqueValues: uniqueValues.length,
      missingValues: data.length - values.length,
      dataType: inferDataType(values)
    };

    // Numeric analysis
    if (columnInfo.dataType === 'numeric') {
      const numericValues = values.map(Number).filter(val => !isNaN(val));
      if (numericValues.length > 0) {
        columnInfo.statistics = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          median: calculateMedian(numericValues)
        };
      }
    }

    summary.columns[column] = columnInfo;

    // Generate insights
    if (columnInfo.missingValues > 0) {
      insights.push({
        type: 'warning',
        message: `Column "${column}" has ${columnInfo.missingValues} missing values (${((columnInfo.missingValues/data.length)*100).toFixed(1)}%)`
      });
    }

    if (columnInfo.dataType === 'numeric' && columnInfo.statistics) {
      insights.push({
        type: 'info',
        message: `"${column}" ranges from ${columnInfo.statistics.min} to ${columnInfo.statistics.max} (avg: ${columnInfo.statistics.mean.toFixed(2)})`
      });
    }
  });

  return { insights, summary, analysisType };
}

function inferDataType(values) {
  if (values.length === 0) return 'unknown';
  
  const numericCount = values.filter(val => !isNaN(Number(val))).length;
  const numericRatio = numericCount / values.length;
  
  if (numericRatio > 0.8) return 'numeric';
  
  const dateCount = values.filter(val => !isNaN(Date.parse(val))).length;
  const dateRatio = dateCount / values.length;
  
  if (dateRatio > 0.8) return 'date';
  
  return 'text';
}

function calculateMedian(numbers) {
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

// Legacy BigQuery endpoint for API tester
app.post('/bigquery', async (req, res) => {
  try {
    const { query } = req.body;
    const [rows] = await bigquery.query({ query });
    res.json({ rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-Agent Orchestration System
const agents = {
  'J.B.': {
    role: 'Interface Agent',
    description: 'Receives user input, interprets intent, and coordinates downstream agents',
    systemPrompt: `You are J.B., the orchestrator agent. You coordinate with specialized agents:
- QuerySynth: Converts natural language to SQL
- InsightMiner: Performs statistical analysis and EDA  
- VizCrafter: Creates visualizations
- ReportSmith: Generates PDF reports
Always be helpful and explain your approach clearly.`
  },
  'QuerySynth': {
    role: 'SQL Generator', 
    description: 'Converts natural language into optimized BigQuery SQL queries',
    systemPrompt: `You are QuerySynth, an expert SQL generator. Convert user requests into valid BigQuery SQL.
Focus on:
- Proper BigQuery syntax
- Optimized queries
- Clear column names
- Appropriate filtering and grouping
Always return SQL in code blocks.`
  },
  'InsightMiner': {
    role: 'EDA Specialist',
    description: 'Performs statistical analysis, anomaly detection, and trend summarization', 
    systemPrompt: `You are InsightMiner, a data analysis expert. Analyze datasets and provide:
- Statistical summaries
- Anomaly detection
- Trend analysis
- Data quality insights
Be thorough but concise.`
  },
  'VizCrafter': {
    role: 'Visualization Agent',
    description: 'Generates charts, plots, and visual insights',
    systemPrompt: `You are VizCrafter, a visualization expert. Recommend and describe appropriate charts for data.
Focus on:
- Chart type recommendations
- Data visualization best practices
- Insight-driven visualizations
Describe what charts should be created.`
  },
  'ReportSmith': {
    role: 'PDF Composer',
    description: 'Formats findings into structured, downloadable PDF reports',
    systemPrompt: `You are ReportSmith, a report generation expert. Create structured reports with:
- Executive summary
- Key findings
- Data insights
- Recommendations
Format in clear, professional language.`
  }
};

// Enhanced chat endpoint with agent routing
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-3.5-turbo', agent = 'J.B.' } = req.body;
    
    // Get agent configuration
    const agentConfig = agents[agent] || agents['J.B.'];
    
    // Prepare messages with agent-specific system prompt
    const systemMessage = {
      role: 'system',
      content: agentConfig.systemPrompt
    };
    
    const fullMessages = [systemMessage, ...messages];
    
    // Set up SSE headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send agent info first
    res.write(`data: ${JSON.stringify({ agent: agent, role: agentConfig.role })}\n\n`);

    const stream = await openai.chat.completions.create({
      model,
      messages: fullMessages,
      stream: true,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content, agent })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Agent info endpoint
app.get('/api/agents', (req, res) => {
  res.json(agents);
});

// Agent routing endpoint
app.post('/api/route-agent', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Simple agent routing logic
    let suggestedAgent = 'J.B.';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sql') || lowerMessage.includes('query') || lowerMessage.includes('select')) {
      suggestedAgent = 'QuerySynth';
    } else if (lowerMessage.includes('analyze') || lowerMessage.includes('statistics') || lowerMessage.includes('insights')) {
      suggestedAgent = 'InsightMiner';
    } else if (lowerMessage.includes('chart') || lowerMessage.includes('graph') || lowerMessage.includes('visualiz')) {
      suggestedAgent = 'VizCrafter';  
    } else if (lowerMessage.includes('report') || lowerMessage.includes('summary') || lowerMessage.includes('pdf')) {
      suggestedAgent = 'ReportSmith';
    }
    
    res.json({ 
      suggestedAgent,
      confidence: 0.8,
      reasoning: `Detected keywords suggesting ${suggestedAgent} would be most appropriate`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', (req, res) => {
  // TODO: Implement file upload handling
  res.json({ message: 'File upload endpoint - to be implemented' });
});

// Legacy OpenAI endpoint for API tester
app.post('/openai', async (req, res) => {
  try {
    const { prompt } = req.body;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
