
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, SearchResult, SearchMode, SourceFlags, Attachment } from "../types";
import { performWebSearch, searchWikipedia } from "./search";

// --- CONFIG ---
const HARDCODED_KEY = "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";

const getSettings = () => {
    const saved = localStorage.getItem('streekx_settings');
    return saved ? JSON.parse(saved) : {};
};

// --- GEMINI CLIENT ---
const getGeminiClient = (key: string) => {
  return new GoogleGenAI({ apiKey: key });
};

// --- HELPERS FOR GEMINI ---
const processAttachmentsForGemini = (attachments?: Attachment[]) => {
    if (!attachments || attachments.length === 0) return [];
    
    return attachments
        .filter(att => att.type === 'image' && att.url.startsWith('data:'))
        .map(att => {
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
        .filter(Boolean);
};

const sanitizeHistoryForGemini = (history: ChatMessage[]) => {
    const validHistory: any[] = [];
    let lastRole = '';

    for (const msg of history) {
        if ((!msg.content || !msg.content.trim()) && (!msg.attachments || msg.attachments.length === 0)) {
            continue;
        }
        const role = msg.role === 'model' ? 'model' : 'user';
        const parts: any[] = [];
        if (msg.content && msg.content.trim()) {
            parts.push({ text: msg.content });
        }
        const attParts = processAttachmentsForGemini(msg.attachments);
        if (attParts.length > 0) parts.push(...attParts);

        if (parts.length === 0) continue;

        if (role === lastRole && validHistory.length > 0) {
            const prev = validHistory[validHistory.length - 1];
            prev.parts.push(...parts); 
        } else {
            validHistory.push({ role, parts });
            lastRole = role;
        }
    }
    return validHistory;
};

// --- HELPERS FOR GROQ ---
const generateGroqResponse = async (
    apiKey: string,
    systemPrompt: string,
    history: ChatMessage[],
    currentQuery: string,
    currentAttachments: Attachment[],
    onChunk: (text: string) => void,
    isVoiceContext: boolean,
    hasImages: boolean
) => {
    // 1. Prepare Messages in OpenAI Format
    const messages: any[] = [
        { role: 'system', content: systemPrompt }
    ];

    // History
    history.forEach(msg => {
        if ((!msg.content && !msg.attachments?.length)) return;
        
        const role = msg.role === 'model' ? 'assistant' : 'user';
        let content: any = msg.content;

        // If message has attachments, convert to content array
        if (msg.attachments && msg.attachments.length > 0) {
            content = [{ type: 'text', text: msg.content || " " }];
            msg.attachments.forEach(att => {
                if (att.type === 'image') {
                    content.push({ type: 'image_url', image_url: { url: att.url } });
                }
            });
        }
        messages.push({ role, content });
    });

    // Current Message
    let currentContent: any = currentQuery;
    if (currentAttachments && currentAttachments.length > 0) {
        currentContent = [{ type: 'text', text: currentQuery }];
        currentAttachments.forEach(att => {
            if (att.type === 'image') {
                currentContent.push({ type: 'image_url', image_url: { url: att.url } });
            }
        });
    }
    messages.push({ role: 'user', content: currentContent });

    // 2. Select Groq Model
    // Voice/Speed -> Llama 3.2 11B Vision or Llama 3.3 70B (Very fast on Groq)
    let model = 'llama-3.3-70b-versatile';
    
    // If images are present, we MUST use the vision model
    if (hasImages || (currentAttachments && currentAttachments.length > 0)) {
        model = 'llama-3.2-90b-vision-preview'; 
    } else if (isVoiceContext) {
        // For pure text voice chat, Llama 3.3 70B is extremely fast on Groq and smarter than 8b
        model = 'llama-3.3-70b-versatile'; 
    }

    // 3. Fetch
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: isVoiceContext ? 0.6 : 0.7,
            max_tokens: isVoiceContext ? 250 : 4096
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Groq API Error: ${err.error?.message || response.statusText}`);
    }

    // 4. Handle Streaming (SSE)
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === 'data: [DONE]') return fullText;
            if (trimmed.startsWith('data: ')) {
                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const content = json.choices[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        onChunk(fullText);
                    }
                } catch (e) {
                    // Ignore incomplete JSON chunks
                }
            }
        }
    }
    return fullText;
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
  currentAttachments?: Attachment[],
  isVoiceContext: boolean = false
): Promise<string> => {
    
    // 1. SEARCH STEP - Perplexity-like workflow
    let shouldSearch = true;
    if (isVoiceContext && query.length < 10 && !query.toLowerCase().includes('who') && !query.toLowerCase().includes('what')) {
        shouldSearch = false;
    }

    let searchResults: SearchResult[] = [];
    
    // Check Settings
    const settings = getSettings();
    const userLanguage = settings.aiLanguage || 'Automatic';
    const languageInstruction = userLanguage !== 'Automatic' ? `IMPORTANT: Respond in ${userLanguage} language.` : '';

    if (shouldSearch) {
        // Step 1: Search DuckDuckGo
        onStatusUpdate("Searching the web...");
        try {
            searchResults = await performWebSearch(query, sourceFlags);
            console.log("[v0] DuckDuckGo search returned", searchResults.length, "results");
        } catch (e) {
            console.warn("[v0] Web search failed:", e instanceof Error ? e.message : e);
            // searchResults remains empty, will trigger fallback to Wikipedia
        }

        // Step 2: Augment with Wikipedia if research mode or if we need more context
        if (searchMode === 'Research' || searchResults.length === 0) {
            onStatusUpdate("Checking Wikipedia...");
            try {
                const wikiResults = await searchWikipedia(query);
                console.log("[v0] Wikipedia search returned", wikiResults.length, "results");
                // Combine results (Wikipedia first if in research mode, otherwise DuckDuckGo first)
                searchResults = searchMode === 'Research' 
                    ? [...wikiResults.slice(0, 2), ...searchResults.slice(0, 3)]
                    : [...searchResults.slice(0, 3), ...wikiResults.slice(0, 2)];
            } catch (e) {
                console.warn("[v0] Wikipedia search failed:", e instanceof Error ? e.message : e);
            }
        }

        // Limit to top 5-6 sources for better context window management
        searchResults = searchResults.slice(0, 6);
        console.log("[v0] Total sources for synthesis:", searchResults.length);
        onSourcesFound(searchResults);
    }

    // 2. REASONING PREP
    if (shouldSearch && searchResults.length > 0) {
        onStatusUpdate("Reading sources...");
        await new Promise(r => setTimeout(r, 300)); 
    }
    onStatusUpdate(searchMode === 'Pro' ? "Synthesizing..." : "Generating answer...");

    // Construct Context Blob
    const sourcesText = searchResults.length > 0 
        ? searchResults.map((s, i) => `[${i + 1}] Title: ${s.title}\nURL: ${s.url}\nContent: ${s.snippet}`).join("\n\n")
        : "No external sources found/needed. Rely on your internal knowledge.";
    
    const today = new Date().toDateString();
    
    // Adjust System Prompt based on Mode
    let modeInstruction = "";
    
    if (isVoiceContext) {
        modeInstruction = `
        **VOICE MODE ACTIVE**:
        - You are StreekX, a helpful, witty, and intelligent voice assistant.
        - Your responses will be spoken out loud. 
        - Keep answers SHORT, CONCISE, and CONVERSATIONAL (aim for 1-2 sentences for simple questions).
        - Do NOT use Markdown formatting (no bold, no asterisks, no links).
        - Do NOT use citations like [1].
        - Be direct. Do not say "Based on the search results". Just answer.
        `;
    } else {
        switch (searchMode) {
            case 'Pro':
                modeInstruction = `
                **PRO MODE ACTIVE**:
                - Provide a highly detailed, extensive answer.
                - Use advanced reasoning.
                - Break down complex topics.
                `;
                break;
            case 'Research':
                modeInstruction = `
                **RESEARCH MODE ACTIVE**:
                - Focus strictly on academic, factual, and data-driven information.
                - Structure the output like a research summary.
                `;
                break;
            case 'Labs':
                modeInstruction = `
                **LABS MODE ACTIVE**:
                - Be creative, experimental, and think outside the box.
                - Provide code snippets if applicable.
                `;
                break;
            default:
                modeInstruction = "Provide a direct, helpful, and professional answer.";
        }
    }

    const systemPrompt = `You are StreekX, a real-time AI search engine powered by web and Wikipedia searches.
    Current Date: ${today}.
    ${modeInstruction}
    ${languageInstruction}
    
    Your goal is to SYNTHESIZE and REWRITE the provided search results into a comprehensive, natural answer to the user's query.
    Do NOT simply repeat the search results. Instead, combine them intelligently to create a coherent response.
    
    WORKFLOW:
    1. Read the search results below
    2. Extract key information relevant to the query
    3. Synthesize into a natural, flowing answer
    4. Add citations to credible sources
    5. Fill gaps with your knowledge if needed
    
    RULES:
    1. **Citations**: ${isVoiceContext ? "NO CITATIONS." : "You MUST cite your sources inline using brackets like [1], [2]. Number them in order of appearance."}
    2. **Tone**: ${isVoiceContext ? "Spoken, casual, natural." : "Professional, helpful, and conversational."}
    3. **Format**: ${isVoiceContext ? "Plain text." : "Markdown with proper formatting."}
    4. **Synthesis**: Rewrite and combine information from sources, don't quote directly
    5. **Context**: ${projectContext || "None"}
    
    SEARCH RESULTS TO SYNTHESIZE:
    ${sourcesText}
    `;

    // Prioritize Env Key, then Fallback Key
    const apiKey = process.env.API_KEY || HARDCODED_KEY;
    
    if (!apiKey) {
        const err = "Configuration Error: API Key missing.";
        onChunk(err);
        return err;
    }

    try {
        // --- PROVIDER DISPATCH ---
        
        // CHECK 1: GROQ (Prioritized for Voice)
        // If key starts with 'gsk_' OR if we are in voice mode and the key allows it (assuming our fallback is Groq)
        if (apiKey.startsWith('gsk_')) {
            const hasImages = history.some(m => m.attachments?.some(a => a.type === 'image'));
            return await generateGroqResponse(
                apiKey,
                systemPrompt,
                history,
                query,
                currentAttachments || [],
                onChunk,
                isVoiceContext,
                hasImages
            );
        }

        // CHECK 2: GEMINI (Default for Google Keys)
        const ai = getGeminiClient(apiKey);

        const modelName = (searchMode === 'Pro' || searchMode === 'Research') && !isVoiceContext
            ? 'gemini-3-pro-preview' 
            : 'gemini-3-flash-preview';

        const historyParts = sanitizeHistoryForGemini(history);
        
        const currentParts: any[] = [{ 
            text: `User Query: ${query}\n\nBased on the search results provided in the system prompt, answer this query.` 
        }];
        const currentAttParts = processAttachmentsForGemini(currentAttachments);
        if (currentAttParts.length > 0) {
            currentParts.unshift(...currentAttParts);
        }

        const contents = [...historyParts];
        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents[contents.length - 1].parts.push(...currentParts);
        } else {
            contents.push({ role: 'user', parts: currentParts });
        }

        const responseStream = await ai.models.generateContentStream({
            model: modelName, 
            contents: contents,
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

    } catch (e: any) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error("[v0] AI Generation Error:", errorMsg);
        
        // Provide specific error guidance
        let errText = "I'm having trouble generating a response. ";
        
        if (errorMsg.includes('429') || errorMsg.includes('rate')) {
            errText += "The AI service is rate limited. Please try again in a moment.";
        } else if (errorMsg.includes('401') || errorMsg.includes('auth')) {
            errText += "API authentication failed. Please check your API key in settings.";
        } else if (errorMsg.includes('gateway') || errorMsg.includes('502') || errorMsg.includes('503')) {
            errText += "The service is temporarily unavailable. Please try again shortly.";
        } else if (errorMsg.includes('timeout')) {
            errText += "The request timed out. Please check your internet connection and try again.";
        } else {
            errText += "Please check your connection and API configuration.";
        }
        
        onChunk(errText);
        return errText;
    }
};
