
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, SearchResult } from "../types";
import { performWebSearch } from "./search";

// --- CONFIG ---
// We read from localStorage to see which model the user selected in Settings
const getSettings = () => {
    const saved = localStorage.getItem('streekx_settings');
    return saved ? JSON.parse(saved) : {};
};

// --- GROQ CLIENT (Simulated via Fetch to avoid adding another heavy SDK dependency) ---
const callGroqAPI = async (messages: any[], systemPrompt: string, onChunk: (text: string) => void) => {
    // NOTE: In a real app, you would use process.env.GROQ_API_KEY. 
    // Since we don't have it, we will throw to trigger the graceful fallback, 
    // OR if you have a proxy, call it here.
    // For this fully functional demo, we assume the user might not have a Groq key, so we default to Gemini logic 
    // but structure this to work if a key was provided.
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Groq API Key missing");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            model: "mixtral-8x7b-32768",
            stream: true
        })
    });

    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
            if (line.trim().startsWith("data: ")) {
                const jsonStr = line.trim().substring(6);
                if (jsonStr === "[DONE]") break;
                try {
                    const json = JSON.parse(jsonStr);
                    const content = json.choices[0]?.delta?.content || "";
                    buffer += content;
                    onChunk(buffer);
                } catch (e) {}
            }
        }
    }
    return buffer;
};

// --- GEMINI CLIENT ---
const getGeminiClient = () => {
  const apiKey = process.env.API_KEY; // From metadata/env
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- MAIN AI ORCHESTRATOR ---
export const generateSmartResponse = async (
  query: string,
  history: ChatMessage[],
  onStatusUpdate: (status: string) => void,
  onSourcesFound: (sources: SearchResult[]) => void,
  onChunk: (text: string) => void,
  projectContext?: string
): Promise<string> => {
    const settings = getSettings();
    const useGroq = settings.aiModel === 'Groq LPU'; // Example setting check
    
    // 1. SEARCH STEP
    onStatusUpdate("Searching the web...");
    
    // Check if query implies real-time info (simple heuristic) or if we just default to always search (Perplexity style)
    // For StreekX, we always search to provide grounding.
    const searchResults = await performWebSearch(query);
    onSourcesFound(searchResults);

    // 2. REASONING / PROMPT ENGINEERING STEP
    onStatusUpdate("Reading sources...");
    await new Promise(r => setTimeout(r, 600)); // UX pause to let user see sources
    
    onStatusUpdate("Generating answer...");

    // Construct Context Blob
    const sourcesText = searchResults.map((s, i) => `[${i + 1}] Title: ${s.title}\nURL: ${s.url}\nContent: ${s.snippet}`).join("\n\n");
    
    const today = new Date().toDateString();
    
    const systemPrompt = `You are StreekX, a real-time AI search engine. 
    Current Date: ${today}.
    
    Your goal is to answer the user's query comprehensively using the provided Search Results.
    
    RULES:
    1. **Citations**: You MUST cite your sources inline using brackets like [1], [2]. 
       - Every factual claim must be backed by a citation from the provided context.
       - Place citations immediately after the sentence or clause they support.
    2. **Tone**: Professional, direct, and concise. Do not fluff. Be like Perplexity.ai.
    3. **Format**: Use Markdown. Use bold for key entities. Use lists where appropriate.
    4. **No Hallucination**: If the search results do not contain the answer, admit it or provide a best guess while stating the limitation.
    5. **Project Context**: ${projectContext || "None"}
    
    SEARCH RESULTS TO USE:
    ${sourcesText}
    `;

    const messageHistory = history.map(h => ({
        role: h.role,
        content: h.content
    }));

    // Add current query with explicit instruction
    const fullPrompt = `User Query: ${query}\n\nBased on the search results provided in the system prompt, answer this query.`;

    try {
        // 3. GENERATION STEP
        if (useGroq) {
            try {
                return await callGroqAPI([...messageHistory, { role: 'user', content: fullPrompt }], systemPrompt, onChunk);
            } catch (e) {
                console.warn("Groq failed, falling back to Gemini", e);
                // Fallthrough to Gemini
            }
        }

        const ai = getGeminiClient();
        if (!ai) {
             // Ultimate Fallback if NO API KEYS are present at all
            const mockText = "I see you haven't configured an API key. Normally, I would have read those " + searchResults.length + " sources and synthesized an answer. \n\nHere is a simulated summary: Based on the search results from " + (searchResults[0]?.source || "the web") + ", the answer to '" + query + "' involves complex factors described in the provided links.";
            let buffer = "";
            for(const word of mockText.split(" ")) {
                buffer += word + " ";
                onChunk(buffer);
                await new Promise(r => setTimeout(r, 50));
            }
            return mockText;
        }

        // Using Gemini 1.5 Flash or Pro via the updated SDK
        // Note: We use the 'systemInstruction' config for the persona + sources
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash', // Using latest flash for speed
            contents: [
                ...messageHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] })), // History
                { role: 'user', parts: [{ text: fullPrompt }] } // Current
            ],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7
            }
        });

        let fullResponse = "";
        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
                fullResponse += text;
                onChunk(fullResponse);
            }
        }
        return fullResponse;

    } catch (e) {
        console.error("LLM Generation Error", e);
        const errText = "I encountered an error generating the response. Please try again.";
        onChunk(errText);
        return errText;
    }
};
