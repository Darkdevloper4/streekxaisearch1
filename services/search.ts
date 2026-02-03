
import { SearchResult, SourceFlags } from "../types";

// Helper to generate consistent fallback data when scraping fails
const getFallbackResults = (query: string): SearchResult[] => {
    return [
        {
            title: `${query} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            snippet: `Encyclopedia article about ${query}. Covers history, key definitions, and general overview. (Simulated Result due to connection issues)`,
            source: 'wikipedia.org',
            favicon: 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64'
        },
        {
            title: `Latest News: ${query}`,
            url: `https://news.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: `Recent updates, articles, and breaking news regarding ${query} from major international sources.`,
            source: 'news.google.com',
            favicon: 'https://www.google.com/s2/favicons?domain=news.google.com&sz=64'
        },
        {
            title: `${query} - Discussion & Opinions`,
            url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
            snippet: `Community discussions, reviews, and user opinions about ${query} from Reddit.`,
            source: 'reddit.com',
            favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64'
        },
        {
            title: `Definition of ${query}`,
            url: `https://www.dictionary.com/browse/${encodeURIComponent(query)}`,
            snippet: `Standard definition, pronunciation, and usage examples for "${query}".`,
            source: 'dictionary.com',
            favicon: 'https://www.google.com/s2/favicons?domain=dictionary.com&sz=64'
        }
    ];
};

export const performWebSearch = async (query: string, sourceFlags?: SourceFlags): Promise<SearchResult[]> => {
    try {
        let finalQuery = query;

        // Apply Source Filters via search operators
        if (sourceFlags) {
            const operators = [];
            if (sourceFlags.academic) operators.push('site:.edu OR site:arxiv.org OR site:scholar.google.com OR site:jstor.org');
            if (sourceFlags.finance) operators.push('site:bloomberg.com OR site:cnbc.com OR site:finance.yahoo.com OR site:wsj.com');
            if (sourceFlags.social) operators.push('site:reddit.com OR site:twitter.com OR site:quora.com OR site:news.ycombinator.com');
            
            // If specific flags are set, append them. If only 'web' or nothing is set, normal search.
            if (operators.length > 0) {
                finalQuery = `${query} (${operators.join(' OR ')})`;
            }
        }

        // 1. Use DuckDuckGo HTML endpoint
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalQuery)}`;
        
        // 2. Route through AllOrigins (CORS Proxy)
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(ddgUrl)}&t=${Date.now()}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`Proxy returned ${response.status}`);
        }

        const data = await response.json();
        const html = data.contents;

        if (!html) {
             throw new Error("Empty response from proxy");
        }

        // 3. Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const results: SearchResult[] = [];
        const resultElements = doc.querySelectorAll('.result');

        resultElements.forEach((el, index) => {
            if (index >= 8) return; // Limit to top 8 results for better context
            
            const titleEl = el.querySelector('.result__title a');
            const snippetEl = el.querySelector('.result__snippet');
            const urlEl = el.querySelector('.result__url');

            if (titleEl && snippetEl) {
                // Extract URL
                let rawUrl = (urlEl as HTMLElement)?.innerText.trim() || (titleEl as HTMLAnchorElement).href;
                if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;

                let domain = 'web';
                try {
                    domain = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).hostname;
                } catch (e) {}

                const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                results.push({
                    title: (titleEl as HTMLElement).innerText.trim(),
                    url: rawUrl,
                    snippet: (snippetEl as HTMLElement).innerText.trim(),
                    source: domain,
                    favicon: favicon
                });
            }
        });

        // Fallback if scraping fails
        if (results.length === 0) {
            console.warn("Search scraping yielded 0 results, using fallback.");
            return getFallbackResults(query);
        }

        return results;

    } catch (error) {
        console.warn("Search API Error (using fallback):", error);
        return getFallbackResults(query);
    }
};
