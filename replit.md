# STREEKX

## Overview
STREEKX is an AI-powered search engine web application built with React, Vite, and TypeScript. It features user authentication via Supabase, AI responses via Gemini/Groq APIs, and web search capabilities.

## Project Architecture
- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **Auth/Database**: Supabase (external, hardcoded config)
- **AI Services**: Google Gemini and Groq APIs
- **Entry Point**: `index.tsx` -> `App.tsx`

## Directory Structure
```
├── index.html          # HTML entry point
├── index.tsx           # React entry point
├── App.tsx             # Main app component
├── types.ts            # TypeScript type definitions
├── vite.config.ts      # Vite configuration
├── components/         # React components
│   ├── Auth.tsx
│   ├── Home.tsx
│   ├── SearchInterface.tsx
│   ├── StreekxAssistant.tsx
│   ├── Settings.tsx
│   └── ...
├── services/           # API services
│   ├── supabase.ts     # Supabase client & database helpers
│   ├── gemini.ts       # Gemini/Groq AI integration
│   ├── search.ts       # Web search service
│   └── weather.ts      # Weather service
└── context/
    └── ThemeContext.tsx # Theme context provider
```

## Development
- **Dev server**: `npm run dev` (port 5000)
- **Build**: `npm run build`

## Recent Changes
- 2026-02-06: Initial Replit setup - configured Vite for port 5000 with allowedHosts, added module script entry point to index.html, removed importmap (handled by Vite bundler)
