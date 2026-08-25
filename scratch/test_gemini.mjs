import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const apiKeyLine = envFile.split('\n').find(line => line.startsWith('VITE_GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : '';

console.log("API Key found:", apiKey ? "Yes (length " + apiKey.length + ")" : "No");

try {
  const aiClient = new GoogleGenAI({ apiKey: apiKey });
  const response = await aiClient.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Hello, this is a test.',
  });
  console.log("Response:", response.text);
} catch (error) {
  console.error("Error:", error.message);
  console.error(error);
}
