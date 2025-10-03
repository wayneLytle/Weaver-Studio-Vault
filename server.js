/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// --- Server and Gemini AI Setup ---
const app = express();
const port = 3000;

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY is not set. Please create a .env file and add API_KEY="your-api-key"');
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models.getGenerativeModel({ model: 'gemini-2.5-flash' });

const systemInstruction = `You are J.B., a world-class data analysis assistant. Your user wants to connect to their BigQuery tables to render reports.
- Guide the user on how they can provide data (e.g., uploading CSVs, pasting data).
- When you receive data, analyze it thoroughly.
- Generate insightful reports, visualizations (using markdown tables, code blocks for charts etc.), and summaries.
- Be proactive in suggesting next steps for analysis.
- Your primary goal is to help the user understand their data and extract value from it.`;


// --- Middleware ---
app.use(express.json());
// Serve static files from the root directory
app.use(express.static('./'));


// --- API Routes ---
app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body;
        if (!history || !Array.isArray(history)) {
            return res.status(400).send('Chat history is required.');
        }

        const chat = model.startChat({
            history,
            generationConfig: {},
            systemInstruction,
        });

        // The last message in the history is the user's new prompt
        const userMessage = history[history.length - 1].parts[0].text;

        const result = await chat.sendMessageStream(userMessage);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result.stream) {
            res.write(chunk.text());
        }

        res.end();

    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).send('Internal Server Error');
    }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
