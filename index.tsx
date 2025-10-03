/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { marked } from 'marked';

// --- DOM Elements ---
const chatHistoryEl = document.getElementById('chat-history')!;
const chatForm = document.getElementById('chat-form')!;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const uploadButton = document.getElementById('upload-btn')!;
const sendButton = document.getElementById('send-btn') as HTMLButtonElement;
const dataView = document.getElementById('data-view')!;

// Create file input for uploads
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;
fileInput.accept = '.csv,.json,.txt,.xlsx,.sql';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// --- Type Definitions ---
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
    agent?: string;
}

interface DataResult {
    type: 'table' | 'chart' | 'report';
    data: any;
    metadata?: any;
}

// --- State ---
let isGenerating = false;
let chatHistory: ChatMessage[] = [];
let currentConversationId = Date.now().toString();

// --- Utility Functions ---

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!', 'success');
    }
}

/**
 * Show notification to user
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- Chat Functions ---

/**
 * Renders a message in the chat history with enhanced features
 */
async function addMessage(role: 'user' | 'assistant' | 'system', content: string, agent?: string): Promise<HTMLElement> {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${role}-message`);
    
    // Add agent indicator for multi-agent responses
    if (agent && role === 'assistant') {
        const agentBadge = document.createElement('div');
        agentBadge.className = 'agent-badge';
        agentBadge.innerHTML = `
            <span class="agent-icon">${getAgentIcon(agent)}</span>
            <span class="agent-name">${agent}</span>
        `;
        messageElement.appendChild(agentBadge);
    }

    // Parse and render markdown content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = await marked.parse(content, { breaks: true, gfm: true });
    messageElement.appendChild(contentDiv);

    // Add message actions (copy, download, etc.)
    if (role === 'assistant') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.innerHTML = `
            <button class="action-btn copy-btn" title="Copy message">📋</button>
            <button class="action-btn download-btn" title="Download as text">💾</button>
            <button class="action-btn regenerate-btn" title="Regenerate response">🔄</button>
        `;
        messageElement.appendChild(actionsDiv);

        // Add event listeners for actions
        actionsDiv.querySelector('.copy-btn')?.addEventListener('click', () => copyToClipboard(content));
        actionsDiv.querySelector('.download-btn')?.addEventListener('click', () => downloadText(content, 'response.txt'));
        actionsDiv.querySelector('.regenerate-btn')?.addEventListener('click', () => regenerateLastResponse());
    }

    chatHistoryEl.appendChild(messageElement);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return messageElement;
}

/**
 * Get icon for different agents
 */
function getAgentIcon(agent: string): string {
    const icons: Record<string, string> = {
        'J.B.': '🧠',
        'QuerySynth': '🔍',
        'InsightMiner': '💎',
        'VizCrafter': '📊',
        'ReportSmith': '📄'
    };
    return icons[agent] || '🤖';
}

/**
 * Download text as file
 */
function downloadText(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Creates and adds a "thinking" indicator for the model
 */
function addThinkingIndicator(agent: string = 'J.B.'): HTMLElement {
    const thinkingElement = document.createElement('div');
    thinkingElement.classList.add('message', 'assistant-message', 'thinking');
    thinkingElement.innerHTML = `
        <div class="thinking-content">
            <span class="agent-icon">${getAgentIcon(agent)}</span>
            <div class="thinking-text">
                <span class="thinking-dots"></span>
                <span>${agent} is thinking...</span>
            </div>
        </div>
    `;
    chatHistoryEl.appendChild(thinkingElement);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return thinkingElement;
}

/**
 * Enhanced message sending with agent routing
 */
async function sendMessage(message: string, files?: FileList) {
    if (isGenerating || (!message.trim() && !files?.length)) return;

    isGenerating = true;
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Handle file uploads first
    if (files && files.length > 0) {
        for (const file of Array.from(files)) {
            await processFileUpload(file);
        }
    }

    // Check if message contains SQL query
    const containsSQL = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(message);
    
    // Add user message to UI and history
    await addMessage('user', message);
    const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now()
    };
    chatHistory.push(userMessage);

    // If it looks like a SQL query, execute it directly with QuerySynth
    if (containsSQL && message.toLowerCase().includes('select')) {
        await executeBigQueryDirect(message);
        isGenerating = false;
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
        return;
    }

    // Route to appropriate agent
    let selectedAgent = 'J.B.';
    try {
        const routingResponse = await fetch('/api/route-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (routingResponse.ok) {
            const routing = await routingResponse.json();
            selectedAgent = routing.suggestedAgent;
        }
    } catch (error) {
        console.warn('Agent routing failed, using J.B.:', error);
    }

    const thinkingIndicator = addThinkingIndicator(selectedAgent);

    try {
        // Prepare messages for the selected agent
        const messages = chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                messages,
                model: 'gpt-3.5-turbo',
                agent: selectedAgent,
                conversationId: currentConversationId
            }),
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }

        // Handle streaming response with agent info
        const assistantResponse = await handleStreamingResponse(response, thinkingIndicator, selectedAgent);
        
        // Check if response contains SQL that should be executed
        const sqlMatches = assistantResponse.match(/```sql\n([\s\S]*?)\n```/g);
        if (sqlMatches && selectedAgent === 'QuerySynth') {
            for (const match of sqlMatches) {
                const sql = match.replace(/```sql\n/, '').replace(/\n```/, '').trim();
                if (sql.toLowerCase().includes('select')) {
                    showNotification('Executing SQL query...', 'info');
                    await executeBigQueryDirect(sql);
                }
            }
        }

        // If InsightMiner provided analysis, update data viewer
        if (selectedAgent === 'InsightMiner' && assistantResponse.includes('analysis')) {
            // Could trigger additional data visualization here
        }

    } catch (error) {
        console.error("Error sending message:", error);
        if (thinkingIndicator.parentNode) {
            thinkingIndicator.remove();
        }
        await addMessage('assistant', 'Sorry, I encountered an error. Please check your connection and try again.');
        showNotification('Failed to send message', 'error');
    } finally {
        isGenerating = false;
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

/**
 * Execute BigQuery directly and display results
 */
async function executeBigQueryDirect(query: string): Promise<void> {
    try {
        showNotification('Executing BigQuery...', 'info');
        
        const response = await fetch('/api/bigquery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Query failed');
        }

        // Display results in chat
        const resultMessage = `
## 📊 BigQuery Results

**Query executed successfully!**
- **Rows returned:** ${result.metadata.rowCount}
- **Execution time:** ${result.metadata.executionTimeMs}ms
- **Columns:** ${result.metadata.columnCount}

\`\`\`sql
${query}
\`\`\`

*Results are displayed in the data viewer →*
        `;

        await addMessage('assistant', resultMessage, 'QuerySynth');

        // Update data viewer
        if (result.data && result.data.length > 0) {
            updateDataViewer({
                type: 'table',
                data: result.data,
                metadata: result.metadata
            });

            // Generate and display insights
            setTimeout(() => {
                generateInsights(result.data);
            }, 500);
        }

        showNotification('Query executed successfully!', 'success');

    } catch (error) {
        console.error('BigQuery execution error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await addMessage('assistant', `❌ **Query Error:** ${errorMessage}`, 'QuerySynth');
        showNotification('Query failed', 'error');
    }
}

/**
 * Handle streaming response from server with agent support
 */
async function handleStreamingResponse(response: Response, thinkingIndicator: HTMLElement, agent: string = 'J.B.'): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let modelMessageElement: HTMLElement | null = null;
    let currentAgent = agent;

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        break;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        
                        // Update agent info if provided
                        if (parsed.agent) {
                            currentAgent = parsed.agent;
                        }
                        
                        if (parsed.content) {
                            fullResponse += parsed.content;
                            
                            // Remove thinking indicator and create/update message
                            if (thinkingIndicator.parentNode) {
                                thinkingIndicator.remove();
                            }
                            if (!modelMessageElement) {
                                modelMessageElement = await addMessage('assistant', fullResponse, currentAgent);
                            } else {
                                const contentDiv = modelMessageElement.querySelector('.message-content');
                                if (contentDiv) {
                                    contentDiv.innerHTML = await marked.parse(fullResponse, { breaks: true, gfm: true });
                                }
                            }
                            chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
                        }
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }

        // Add final message to history
        if (fullResponse) {
            chatHistory.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now(),
                agent: currentAgent
            });
        }

        return fullResponse;

    } catch (error) {
        console.error('Streaming error:', error);
        throw error;
    }
}

/**
 * Process file upload
 */
async function processFileUpload(file: File): Promise<void> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        showNotification(`Uploading ${file.name}...`, 'info');

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Add file upload message
        const fileMessage = `📁 **File Uploaded:** ${file.name} (${formatFileSize(file.size)})\n\nFile has been processed and is ready for analysis.`;
        await addMessage('assistant', fileMessage);
        
        showNotification('File uploaded successfully!', 'success');

    } catch (error) {
        console.error('Upload error:', error);
        showNotification(`Failed to upload ${file.name}`, 'error');
    }
}

/**
 * Regenerate the last assistant response
 */
async function regenerateLastResponse(): Promise<void> {
    if (chatHistory.length < 2) return;
    
    // Remove last assistant message
    chatHistory.pop();
    const lastUserMessage = chatHistory[chatHistory.length - 1];
    
    if (lastUserMessage && lastUserMessage.role === 'user') {
        // Remove last message from UI
        const lastMessageEl = chatHistoryEl.lastElementChild;
        if (lastMessageEl) lastMessageEl.remove();
        
        // Resend the message
        await sendMessage(lastUserMessage.content);
    }
}

// --- Event Listeners ---

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
        sendMessage(message);
        chatInput.value = '';
    }
});

// Enhanced upload button
uploadButton.addEventListener('click', () => {
    fileInput.click();
});

// File input handling
fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const files = target.files;
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        sendMessage(`I've selected ${files.length} file(s): ${fileNames}. Please analyze these files.`, files);
        target.value = ''; // Reset for reuse
    }
});

// Keyboard shortcuts
chatInput.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        chatInput.value = '';
    }
});

// Paste handling for files and images
chatInput.addEventListener('paste', async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
                await processFileUpload(file);
            }
        }
    }
});

// --- Initial Setup ---

/**
 * Display initial greeting
 */
async function displayInitialGreeting() {
    const greeting = `Hello! I'm **J.B.**, your AI Data Analysis Assistant. 

I can help you:
- 🔍 **Analyze BigQuery data** with natural language queries
- 📊 **Create visualizations** and reports
- 📁 **Process uploaded files** (CSV, JSON, Excel)
- 💡 **Generate insights** from your data

**Features available:**
- Upload files by clicking 📎 or dragging & dropping
- Copy responses with 📋
- Download results with 💾
- Use Ctrl+Enter to send messages quickly

How can I help you get started with your data analysis today?`;

    await addMessage('assistant', greeting, 'J.B.');
    chatHistory.push({
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
        agent: 'J.B.'
    });
}

// --- Data Viewer Functions ---

/**
 * Update the data viewer with results
 */
function updateDataViewer(data: DataResult): void {
    const dataViewEl = document.getElementById('data-view')!;
    
    switch (data.type) {
        case 'table':
            renderTable(data.data, dataViewEl);
            break;
        case 'chart':
            renderChart(data.data, dataViewEl);
            break;
        case 'report':
            renderReport(data.data, dataViewEl);
            break;
        default:
            console.warn('Unknown data type:', data.type);
    }
}

/**
 * Render table data in the data viewer
 */
function renderTable(tableData: any[], container: HTMLElement): void {
    if (!tableData || tableData.length === 0) {
        container.innerHTML = '<div class="no-data">No data to display</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = Object.keys(tableData[0]);
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        th.addEventListener('click', () => sortTable(table, columns.indexOf(column)));
        th.style.cursor = 'pointer';
        th.title = 'Click to sort';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            const value = row[column];
            td.textContent = value !== null && value !== undefined ? String(value) : '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Add table controls
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const tableHeader = document.createElement('div');
    tableHeader.className = 'table-header';
    tableHeader.innerHTML = `
        <h3>📊 Query Results (${tableData.length} rows)</h3>
        <div class="table-actions">
            <button class="action-btn" onclick="downloadTableAsCSV()">📥 Download CSV</button>
            <button class="action-btn" onclick="copyTableData()">📋 Copy Data</button>
        </div>
    `;
    
    tableContainer.appendChild(tableHeader);
    tableContainer.appendChild(table);
    
    container.innerHTML = '';
    container.appendChild(tableContainer);

    // Store data for download/copy functions
    (window as any).currentTableData = tableData;
}

/**
 * Sort table by column
 */
function sortTable(table: HTMLTableElement, columnIndex: number): void {
    const tbody = table.querySelector('tbody')!;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const isNumeric = rows.every(row => {
        const cell = row.cells[columnIndex];
        const value = cell.textContent?.trim();
        return !value || !isNaN(Number(value));
    });

    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent?.trim() || '';
        const bValue = b.cells[columnIndex].textContent?.trim() || '';
        
        if (isNumeric) {
            return Number(aValue) - Number(bValue);
        } else {
            return aValue.localeCompare(bValue);
        }
    });

    // Clear and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Render chart placeholder (to be enhanced with actual charting library)
 */
function renderChart(chartData: any, container: HTMLElement): void {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = `
        <h3>📈 Data Visualization</h3>
        <div class="chart-placeholder">
            <p>Chart visualization will be implemented here</p>
            <pre>${JSON.stringify(chartData, null, 2)}</pre>
        </div>
    `;
    container.innerHTML = '';
    container.appendChild(chartContainer);
}

/**
 * Render report
 */
function renderReport(reportData: any, container: HTMLElement): void {
    const reportContainer = document.createElement('div');
    reportContainer.className = 'report-container';
    reportContainer.innerHTML = `
        <h3>📄 Analysis Report</h3>
        <div class="report-content">
            ${reportData.content || 'Report content will appear here'}
        </div>
    `;
    container.innerHTML = '';
    container.appendChild(reportContainer);
}

/**
 * Generate insights from data
 */
function generateInsights(data: any[]): void {
    if (!data || data.length === 0) return;

    const insights: string[] = [];
    const columns = Object.keys(data[0]);
    
    // Basic insights
    insights.push(`Dataset contains ${data.length} rows and ${columns.length} columns`);
    
    // Check for missing values
    columns.forEach(column => {
        const missingCount = data.filter(row => 
            row[column] === null || row[column] === undefined || row[column] === ''
        ).length;
        if (missingCount > 0) {
            insights.push(`Column "${column}" has ${missingCount} missing values (${((missingCount/data.length)*100).toFixed(1)}%)`);
        }
    });

    // Numeric column insights
    columns.forEach(column => {
        const numericValues = data
            .map(row => Number(row[column]))
            .filter(val => !isNaN(val));
        
        if (numericValues.length > 0) {
            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            insights.push(`Column "${column}": Min=${min}, Max=${max}, Avg=${avg.toFixed(2)}`);
        }
    });

    // Display insights
    const dataViewEl = document.getElementById('data-view')!;
    const insightsContainer = document.createElement('div');
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = `
        <h3>💡 Data Insights</h3>
        ${insights.map(insight => `<div class="insight-card"><p>${insight}</p></div>`).join('')}
    `;
    
    dataViewEl.appendChild(insightsContainer);
}

// Global functions for table actions
(window as any).downloadTableAsCSV = function() {
    const data = (window as any).currentTableData;
    if (!data) return;
    
    const csv = convertToCSV(data);
    downloadText(csv, 'query_results.csv');
};

(window as any).copyTableData = function() {
    const data = (window as any).currentTableData;
    if (!data) return;
    
    const csv = convertToCSV(data);
    copyToClipboard(csv);
};

/**
 * Convert array of objects to CSV
 */
function convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                const stringValue = value !== null && value !== undefined ? String(value) : '';
                return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
            }).join(',')
        )
    ].join('\n');
    
    return csvContent;
}

// --- Initialize App ---
displayInitialGreeting();

// Add drag & drop support
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    document.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    document.body.classList.add('drag-over');
}

function unhighlight() {
    document.body.classList.remove('drag-over');
}

document.addEventListener('drop', handleDrop, false);

function handleDrop(e: DragEvent) {
    const dt = e.dataTransfer;
    const files = dt?.files;
    
    if (files && files.length > 0) {
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        sendMessage(`I've dropped ${files.length} file(s): ${fileNames}. Please analyze these files.`, files);
    }
}