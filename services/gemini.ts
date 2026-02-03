
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, SearchResult, SearchMode, SourceFlags, Attachment } from "../types";
import { performWebSearch } from "./search";

// --- CONFIG ---
const getSettings = () => {
    const saved = localStorage.getItem('streekx_settings');
    return saved ? JSON.parse(saved) : {};
};

// --- GEMINI CLIENT ---
const getGeminiClient = () => {
  const apiKey = process.env.API_KEY; // From metadata/env
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- HELPER: CONVERT ATTACHMENT TO INLINE DATA ---
const processAttachments = (attachments?: Attachment[]) => {
    if (!attachments || attachments.length === 0) return [];
    
    return attachments
        .filter(att => att.type === 'image' && att.url.startsWith('data:'))
        .map(att => {
            // Extract base64 and mime type from data URL
            // Format: data:image/png;base64,.....
            const matches = att.url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                return {
                    inlineData: {
                        mimeType: matches[1],
                        data: matches[2]
                    }
                };
            }
            return null;
        })
        .filter(Boolean); // Remove nulls
};

// --- MAIN AI ORCHESTRATOR ---
export const generateSmartResponse = async (
  query: string,
  history: ChatMessage[],
  onStatusUpdate: (status: string) => void,
  onSourcesFound: (sources: SearchResult[]) => void,
  onChunk: (text: string) => void,
  projectContext?: string,
  searchMode: SearchMode = 'Standard',
  sourceFlags?: SourceFlags,
  currentAttachments?: Attachment[]
): Promise<string> => {
    const settings = getSettings();
    
    // 1. SEARCH STEP (Unless in Labs mode with no internet flag, but here we assume always search for now)
    onStatusUpdate(searchMode === 'Research' ? "Conducting deep research..." : "Searching the web...");
    
    // Pass flags to search service
    const searchResults = await performWebSearch(query, sourceFlags);
    onSourcesFound(searchResults);

    // 2. REASONING / PROMPT ENGINEERING STEP
    onStatusUpdate("Reading sources...");
    await new Promise(r => setTimeout(r, 600)); 
    
    onStatusUpdate(searchMode === 'Pro' ? "Reasoning with Pro model..." : "Generating answer...");

    // Construct Context Blob
    const sourcesText = searchResults.map((s, i) => `[${i + 1}] Title: ${s.title}\nURL: ${s.url}\nContent: ${s.snippet}`).join("\n\n");
    
    const today = new Date().toDateString();
    
    // Adjust System Prompt based on Mode
    let modeInstruction = "";
    switch (searchMode) {
        case 'Pro':
            modeInstruction = "You are in PRO MODE. Provide a highly detailed, extensive answer. Use advanced reasoning. Break down complex topics.";
            break;
        case 'Research':
            modeInstruction = "You are in RESEARCH MODE. Focus on academic, factual, and deep-dive information. Prioritize consensus and data. Output should be structured like a research summary.";
            break;
        case 'Labs':
            modeInstruction = "You are in LABS MODE. Be creative, experimental, and concise. Focus on code generation or novel ideas if applicable.";
            break;
        default:
            modeInstruction = "Provide a direct, helpful, and professional answer.";
    }

    const systemPrompt = `You are StreekX, a real-time AI search engine. 
    Current Date: ${today}.
    
    ${modeInstruction}
    
    Your goal is to answer the user's query comprehensively using the provided Search Results and any images provided.
    
    RULES:
    1. **Citations**: You MUST cite your sources inline using brackets like [1], [2]. 
       - Every factual claim must be backed by a citation from the provided context.
       - Place citations immediately after the sentence or clause they support.
    2. **Tone**: Professional, direct, and concise (unless Pro Mode). Do not fluff.
    3. **Format**: Use Markdown. Use bold for key entities. Use lists where appropriate.
    4. **No Hallucination**: If the search results do not contain the answer, admit it.
    5. **Project Context**: ${projectContext || "None"}
    
    SEARCH RESULTS TO USE:
    ${sourcesText}
    `;

    // Process History
    const historyParts = history.map(h => {
        const parts: any[] = [{ text: h.content }];
        const attParts = processAttachments(h.attachments);
        if (attParts.length > 0) parts.push(...attParts);
        return {
            role: h.role,
            parts: parts
        };
    });

    // Process Current User Message
    const currentParts: any[] = [{ 
        text: `User Query: ${query}\n\nBased on the search results provided in the system prompt, answer this query.` 
    }];
    const currentAttParts = processAttachments(currentAttachments);
    if (currentAttParts.length > 0) {
        currentParts.unshift(...currentAttParts); // Add images before text
    }

    try {
        const ai = getGeminiClient();
        if (!ai) {
            const mockText = "I see you haven't configured an API key. Normally, I would have read those " + searchResults.length + " sources and synthesized an answer. \n\nHere is a simulated summary: Based on the search results from " + (searchResults[0]?.source || "the web") + ", the answer to '" + query + "' involves complex factors described in the provided links.";
            onChunk(mockText);
            return mockText;
        }

        // Determine Model based on Mode
        // Pro/Research -> Pro Model (gemini-3-pro-preview if available, falling back to flash for speed in demo)
        // Standard -> Flash
        // Actually, user instructions say: 'gemini-3-pro-preview' for complex text tasks.
        const modelName = (searchMode === 'Pro' || searchMode === 'Research') 
            ? 'gemini-3-pro-preview' 
            : 'gemini-3-flash-preview';

        const responseStream = await ai.models.generateContentStream({
            model: modelName, 
            contents: [
                ...historyParts,
                { role: 'user', parts: currentParts }
            ],
            config: {
                systemInstruction: systemPrompt,
                temperature: searchMode === 'Labs' ? 0.9 : 0.7
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
