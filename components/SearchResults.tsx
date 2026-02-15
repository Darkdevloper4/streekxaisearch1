import React, { useState, useEffect, useRef } from 'react';
import { SearchResult, SearchFilter, SearchSession, Attachment, SearchMode, SourceFlags } from '../types';
import { generateSmartResponse } from '../services/gemini';

interface SearchResultsProps {
  sessionId: string;
  initialQuery: string;
  initialSessions: SearchSession[];
  onBack: () => void;
  onCreateThread: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, updates: Partial<SearchSession>) => void;
  activeProject?: any;
}

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative w-16 h-16 mb-6">
      <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-streekx-primary border-r-streekx-primary animate-spin"></div>
    </div>
    <p className="text-gray-400 text-sm font-medium">Searching the web...</p>
  </div>
);

const ImageResult = ({ result }: { result: SearchResult }) => (
  <a href={result.url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-lg bg-gray-900 aspect-square hover:shadow-lg transition-shadow">
    {result.imageUrl ? (
      <img src={result.imageUrl} alt={result.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
    ) : result.thumbnailUrl ? (
      <img src={result.thumbnailUrl} alt={result.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-600">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      </div>
    )}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <p className="text-white text-xs font-bold line-clamp-2">{result.title}</p>
    </div>
  </a>
);

const VideoResult = ({ result }: { result: SearchResult }) => (
  <a href={result.url} target="_blank" rel="noopener noreferrer" className="group bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
    <div className="relative aspect-video bg-black flex items-center justify-center">
      {result.thumbnailUrl ? (
        <>
          <img src={result.thumbnailUrl} alt={result.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
            </div>
          </div>
        </>
      ) : (
        <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
    </div>
    <div className="p-3">
      <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-streekx-primary transition-colors">{result.title}</h3>
      <p className="text-xs text-gray-500 mt-1">{result.source}</p>
    </div>
  </a>
);

const ShoppingResult = ({ result }: { result: SearchResult }) => (
  <a href={result.url} target="_blank" rel="noopener noreferrer" className="group bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
    <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
      {result.imageUrl ? (
        <img src={result.imageUrl} alt={result.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      ) : (
        <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
      )}
    </div>
    <div className="p-3">
      <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-streekx-primary transition-colors">{result.title}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-streekx-primary font-bold text-sm">{result.price || 'N/A'}</span>
        {result.rating && <span className="text-xs text-yellow-500">⭐ {result.rating.toFixed(1)}</span>}
      </div>
      {result.reviews && <p className="text-xs text-gray-500 mt-1">{result.reviews} reviews</p>}
    </div>
  </a>
);

const MapResult = ({ result }: { result: SearchResult }) => (
  <a href={result.url} target="_blank" rel="noopener noreferrer" className="group bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow p-4">
    <div className="w-full h-48 bg-gray-800 rounded-lg mb-3 flex items-center justify-center relative">
      {result.coordinates ? (
        <div className="w-full h-full flex items-center justify-center text-gray-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </div>
      ) : (
        <div className="text-gray-600 text-center">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      )}
    </div>
    <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-streekx-primary transition-colors">{result.title}</h3>
    <p className="text-xs text-gray-500 mt-1">{result.snippet}</p>
    {result.rating && <p className="text-xs text-yellow-500 mt-2">⭐ {result.rating.toFixed(1)} ({result.reviews} reviews)</p>}
  </a>
);

const WebResult = ({ result }: { result: SearchResult }) => (
  <a href={result.url} target="_blank" rel="noopener noreferrer" className="group p-4 rounded-lg hover:bg-gray-900/50 transition-colors">
    <div className="flex items-start gap-3 mb-2">
      {result.favicon && <img src={result.favicon} alt="" className="w-4 h-4 mt-1 rounded flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />}
      <p className="text-xs text-gray-500">{result.source}</p>
    </div>
    <h3 className="text-lg font-bold text-streekx-primary group-hover:underline line-clamp-2">{result.title}</h3>
    <p className="text-sm text-gray-300 mt-2 line-clamp-2">{result.snippet}</p>
  </a>
);

export default function SearchResults({
  sessionId,
  initialQuery,
  initialSessions,
  onBack,
  onCreateThread,
  onUpdateSession,
  activeProject
}: SearchResultsProps) {
  const session = initialSessions.find(s => s.id === sessionId);
  
  const [currentFilter, setCurrentFilter] = useState<SearchFilter>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [aiAnswer, setAiAnswer] = useState('');
  const [allResults, setAllResults] = useState<SearchResult[]>(session?.allResults || []);
  const [answerLoading, setAnswerLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasExecutedInitial = useRef(false);

  // Execute initial search
  useEffect(() => {
    if (initialQuery && !hasExecutedInitial.current) {
      if (!session?.allResults) {
        hasExecutedInitial.current = true;
        performSearch(initialQuery);
      } else if (session?.allResults) {
        hasExecutedInitial.current = true;
        setAllResults(session.allResults);
        if (session.currentFilter) setCurrentFilter(session.currentFilter);
      }
    }
  }, []);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const mockResults: SearchResult[] = [
        {
          title: "About " + query,
          url: "https://example.com/about",
          snippet: "Learn more about " + query + " and its applications.",
          source: "example.com",
          type: "web",
          favicon: "https://example.com/favicon.ico"
        },
        {
          title: query + " - Wikipedia",
          url: "https://wikipedia.org/wiki/" + query,
          snippet: "Wikipedia article about " + query,
          source: "wikipedia.org",
          type: "web"
        },
        {
          title: query + " - Official Site",
          url: "https://official.example.com",
          snippet: "Official website for " + query,
          source: "official.example.com",
          type: "web"
        },
        {
          title: query + " image 1",
          url: "https://example.com/image1",
          snippet: "Image about " + query,
          source: "example.com",
          type: "image",
          imageUrl: "https://via.placeholder.com/400x300?text=" + encodeURIComponent(query),
          thumbnailUrl: "https://via.placeholder.com/200x150?text=" + encodeURIComponent(query)
        },
        {
          title: query + " image 2",
          url: "https://example.com/image2",
          snippet: "Image about " + query,
          source: "example.com",
          type: "image",
          imageUrl: "https://via.placeholder.com/400x300?text=" + encodeURIComponent(query + " 2"),
          thumbnailUrl: "https://via.placeholder.com/200x150?text=" + encodeURIComponent(query + " 2")
        },
        {
          title: query + " Video Tutorial",
          url: "https://youtube.com/watch?v=example",
          snippet: "Learn about " + query + " in this video",
          source: "youtube.com",
          type: "video",
          thumbnailUrl: "https://via.placeholder.com/320x180?text=Video"
        },
        {
          title: "Buy " + query,
          url: "https://shop.example.com/product",
          snippet: "Shop for " + query,
          source: "shop.example.com",
          type: "shopping",
          price: "$29.99",
          imageUrl: "https://via.placeholder.com/300x300?text=" + encodeURIComponent(query),
          rating: 4.5,
          reviews: 128
        },
        {
          title: "Map location for " + query,
          url: "https://maps.example.com",
          snippet: "Find places related to " + query,
          source: "maps.example.com",
          type: "map",
          coordinates: { lat: 40.7128, lng: -74.0060 },
          rating: 4.8,
          reviews: 256
        }
      ];

      setAllResults(mockResults);

      // Defer parent state update to avoid React update conflicts
      Promise.resolve().then(() => {
        onUpdateSession(sessionId, { allResults: mockResults });
      });

      // Generate AI answer
      await generateAiAnswer(query);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiAnswer = async (query: string) => {
    setAnswerLoading(true);
    try {
      let answer = "";
      const projectPrompt = activeProject?.ai_prompt;
      await generateSmartResponse(
        query,
        [],
        (status) => {},
        (sources) => {},
        (chunk) => {
          answer = chunk;
          setAiAnswer(answer);
        },
        projectPrompt,
        'Standard'
      );
    } catch (error) {
      console.error("Failed to generate answer", error);
      setAiAnswer("Unable to generate an answer at this time. Please try again.");
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    await performSearch(searchInput);
  };

  const getFilteredResults = () => {
    if (currentFilter === 'All') return allResults;
    const filterMap: Record<SearchFilter, SearchResultType | SearchResultType[]> = {
      'All': ['web', 'image', 'video', 'map', 'shopping'],
      'Images': 'image',
      'Videos': 'video',
      'Maps': 'map',
      'Shopping': 'shopping'
    };
    const typeToFilter = filterMap[currentFilter];
    const types = Array.isArray(typeToFilter) ? typeToFilter : [typeToFilter];
    return allResults.filter(r => types.includes(r.type || 'web'));
  };

  const filteredResults = getFilteredResults();

  const renderResultGrid = () => {
    if (currentFilter === 'Images') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {filteredResults.map((result, idx) => (
            <ImageResult key={idx} result={result} />
          ))}
        </div>
      );
    }

    if (currentFilter === 'Videos') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {filteredResults.map((result, idx) => (
            <VideoResult key={idx} result={result} />
          ))}
        </div>
      );
    }

    if (currentFilter === 'Shopping') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {filteredResults.map((result, idx) => (
            <ShoppingResult key={idx} result={result} />
          ))}
        </div>
      );
    }

    if (currentFilter === 'Maps') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
          {filteredResults.map((result, idx) => (
            <MapResult key={idx} result={result} />
          ))}
        </div>
      );
    }

    // All results - show web results with AI answer on top
    return (
      <div className="space-y-6 px-4 pb-6">
        {aiAnswer && !answerLoading && (
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-streekx-primary flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-white mb-3">StreekX Answer</h2>
                <p className="text-gray-300 leading-7">{aiAnswer}</p>
              </div>
            </div>
          </div>
        )}

        {answerLoading && (
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800 flex gap-3 items-center">
            <div className="w-4 h-4 border-2 border-streekx-primary border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            <p className="text-gray-400">Generating answer...</p>
          </div>
        )}

        <div className="space-y-2">
          {filteredResults.filter(r => r.type === 'web' || !r.type).map((result, idx) => (
            <WebResult key={idx} result={result} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-white font-sans relative">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        {/* Search Display */}
        <h1 className="text-2xl font-bold text-white mb-3">{initialQuery}</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
          {(['All', 'Images', 'Videos', 'Maps', 'Shopping'] as SearchFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setCurrentFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
                currentFilter === filter
                  ? 'bg-streekx-primary text-white'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollRef}>
        {isLoading ? (
          <LoadingAnimation />
        ) : allResults.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No results found</p>
          </div>
        ) : (
          <div className="py-6">
            {renderResultGrid()}
          </div>
        )}
      </div>

      {/* Bottom Search Bar */}
      <div className="sticky bottom-0 z-20 bg-black border-t border-gray-800 p-4">
        <form onSubmit={handleSearch} className="bg-gray-900 rounded-full border border-gray-800 focus-within:border-gray-600 transition-colors flex items-center px-4 py-3 relative shadow-lg">
          <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            placeholder="Search..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 ml-4"
          />

          {isLoading && (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-3 h-3 border-2 border-streekx-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500 hidden sm:inline">Searching...</span>
            </div>
          )}

          {!isLoading && searchInput && (
            <button
              type="submit"
              className="p-2 rounded-full ml-2 text-white bg-streekx-primary hover:opacity-80 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
          )}
        </form>

        {/* Create Thread Button */}
        {allResults.length > 0 && (
          <button
            onClick={() => {
              onUpdateSession(sessionId, { allResults, currentFilter });
              onCreateThread(sessionId);
            }}
            className="w-full mt-4 bg-streekx-primary text-white font-bold py-3 rounded-full hover:bg-streekx-primaryDark transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m-7-7h14"></path></svg>
            Create Thread & Chat
          </button>
        )}
      </div>
    </div>
  );
}
