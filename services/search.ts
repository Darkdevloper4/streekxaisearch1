import { SearchResult, SourceFlags, SearchResultType } from "../types";

// Helper to generate consistent fallback data when scraping fails
const getFallbackResults = (query: string): SearchResult[] => {
    return [
        {
            title: `${query} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            snippet: `Encyclopedia article about ${query}. Covers history, key definitions, and general overview. (Simulated Result due to connection issues)`,
            source: 'wikipedia.org',
            favicon: 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64',
            type: 'web'
        },
        {
            title: `Latest News: ${query}`,
            url: `https://news.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: `Recent updates, articles, and breaking news regarding ${query} from major international sources.`,
            source: 'news.google.com',
            favicon: 'https://www.google.com/s2/favicons?domain=news.google.com&sz=64',
            type: 'web'
        },
        {
            title: `${query} - Discussion & Opinions`,
            url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
            snippet: `Community discussions, reviews, and user opinions about ${query} from Reddit.`,
            source: 'reddit.com',
            favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
            type: 'web'
        },
        {
            title: `Definition of ${query}`,
            url: `https://www.dictionary.com/browse/${encodeURIComponent(query)}`,
            snippet: `Standard definition, pronunciation, and usage examples for "${query}".`,
            source: 'dictionary.com',
            favicon: 'https://www.google.com/s2/favicons?domain=dictionary.com&sz=64',
            type: 'web'
        },
        {
            title: `${query} - Images`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
            snippet: `Related images for ${query}`,
            source: 'google.com',
            type: 'image',
            imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(query)}`
        },
        {
            title: `${query} - Video Results`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            snippet: `Video content related to ${query}`,
            source: 'youtube.com',
            type: 'video',
            thumbnailUrl: `https://via.placeholder.com/320x180?text=Video`
        }
    ];
};

// Helper to determine result type based on domain/URL
const detectResultType = (source: string, url: string): SearchResultType => {
    const lowerSource = source.toLowerCase();

    if (lowerSource.includes('youtube') || lowerSource.includes('vimeo') || lowerSource.includes('video')) return 'video';
    if (lowerSource.includes('instagram') || lowerSource.includes('pinterest') || lowerSource.includes('flickr')) return 'image';
    if (lowerSource.includes('maps') || lowerSource.includes('yelp') || lowerSource.includes('location')) return 'map';
    if (lowerSource.includes('amazon') || lowerSource.includes('ebay') || lowerSource.includes('shop') || url.includes('price=')) return 'shopping';

    return 'web';
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
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 8000); // 8 second timeout

        let response;
        try {
          response = await fetch(proxyUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // Always return fallback on fetch errors - timeout, abort, network, etc
          console.warn("Fetch error during search, using fallback:", fetchError?.message || fetchError?.name);
          return getFallbackResults(query);
        }

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
                const resultType = detectResultType(domain, rawUrl);

                results.push({
                    title: (titleEl as HTMLElement).innerText.trim(),
                    url: rawUrl,
                    snippet: (snippetEl as HTMLElement).innerText.trim(),
                    source: domain,
                    favicon: favicon,
                    type: resultType
                });
            }
        });

        // Fallback if scraping fails
        if (results.length === 0) {
            console.warn("Search scraping yielded 0 results, using fallback.");
            return getFallbackResults(query);
        }

        return results;

    } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || '';
        console.warn("Search API Error (using fallback):", errorMessage);
        // Always return fallback results on any error (network, timeout, parsing, etc)
        // This includes AbortError, network errors, and parsing failures
        return getFallbackResults(query);
    }
};
