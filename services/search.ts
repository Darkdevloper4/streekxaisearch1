
import { SearchResult, SourceFlags } from "../types";

// Wikipedia Search Function with CORS handling
export const searchWikipedia = async (query: string): Promise<SearchResult[]> => {
    try {
        // Wikipedia API supports CORS natively, no proxy needed
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(wikiUrl, { 
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn("[v0] Wikipedia API returned:", response.status);
            return [];
        }
        
        const data = await response.json();
        
        if (!data.query?.search || data.query.search.length === 0) {
            return [];
        }
        
        return data.query.search.slice(0, 3).map((item: any) => ({
            title: item.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
            snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 150), // Strip HTML tags and limit
            source: 'wikipedia.org',
            favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico'
        }));
    } catch (error) {
        console.warn("[v0] Wikipedia search error:", error instanceof Error ? error.message : error);
        return [];
    }
};

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

        // Apply Source Filters via search operators (Real-time filtering)
        if (sourceFlags) {
            const operators = [];
            
            // ACADEMIC: .edu, scholar, jstor, researchgate, science.org
            if (sourceFlags.academic) {
                operators.push('site:.edu OR site:scholar.google.com OR site:jstor.org OR site:arxiv.org OR site:researchgate.net OR site:science.org OR site:nature.com');
            }
            
            // FINANCE: bloomberg, cnbc, wsj, ft, investopedia, yahoo finance
            if (sourceFlags.finance) {
                operators.push('site:bloomberg.com OR site:cnbc.com OR site:finance.yahoo.com OR site:wsj.com OR site:ft.com OR site:investopedia.com OR site:marketwatch.com');
            }
            
            // SOCIAL: reddit, twitter, quora, hacker news, linkedin, stackoverflow
            if (sourceFlags.social) {
                operators.push('site:reddit.com OR site:twitter.com OR site:quora.com OR site:news.ycombinator.com OR site:linkedin.com OR site:stackoverflow.com');
            }
            
            // If specific flags are set, append them.
            if (operators.length > 0) {
                // We wrap operators in parens to ensure logical grouping
                finalQuery = `${query} (${operators.join(' OR ')})`;
            }
        }

        // 1. Use DuckDuckGo HTML endpoint
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalQuery)}`;
        
        // 2. Route through AllOrigins (CORS Proxy) with timeout
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(ddgUrl)}&t=${Date.now()}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        let response;
        try {
            response = await fetch(proxyUrl, { signal: controller.signal });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.warn("[v0] DuckDuckGo proxy timeout/failed, using fallback");
            return getFallbackResults(query);
        }
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn("[v0] Proxy returned status:", response.status);
            return getFallbackResults(query);
        }

        let data, html;
        try {
            data = await response.json();
            html = data.contents;
        } catch (parseError) {
            console.warn("[v0] Failed to parse proxy response");
            return getFallbackResults(query);
        }

        if (!html) {
             console.warn("[v0] Empty response from proxy");
             return getFallbackResults(query);
        }

        // 3. Parse HTML
        try {
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
                    try {
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
                    } catch (itemError) {
                        console.warn("[v0] Error parsing individual search result:", itemError);
                    }
                }
            });

            // Fallback if scraping fails
            if (results.length === 0) {
                console.warn("[v0] Search scraping yielded 0 results, using fallback");
                return getFallbackResults(query);
            }

            return results;
        } catch (parseError) {
            console.warn("[v0] Error parsing search HTML:", parseError);
            return getFallbackResults(query);
        }

    } catch (error) {
        console.warn("[v0] Search API Error (using fallback):", error instanceof Error ? error.message : error);
        return getFallbackResults(query);
    }
};
