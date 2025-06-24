# 🌟 Momento — Live Your Story

# 🌟 Momento — Live Your Story

## Core Mission
Don't just post stories. Live them. Momento helps individuals and couples intentionally create meaningful, fun, and unforgettable moments — and then reflect, preserve, share, or relive them — all while unlocking real-world benefits and deeper joy.

## Core Philosophy
Most apps chase your attention. Momento chases your fulfillment.

## Project Structure
```
Momento/
├── docs/                          # Essential documentation
│   ├── mcp-integration/          # MCP server implementations
│   ├── llm-integration.md        # LLM integration guide
│   └── mcp-architecture.md       # MCP architecture overview
├── mobile-app/MomentoApp/        # React Native + Expo mobile app
│   ├── screens/                  # Onboarding and main screens
│   ├── lib/supabase.ts          # Database client and functions
│   └── constants/                # App theming and constants
├── database/                     # Database management
│   ├── migrations/               # SQL schema migrations
│   ├── run-migrations.js         # Migration runner script
│   └── package.json             # Database tooling
└── FINAL_ALIGNMENT_REPORT.md    # Complete system documentation
```

## Quick Start

### Database Setup
```bash
cd database
npm install
SUPABASE_SERVICE_ROLE_KEY="your-key" npm run migrate
```

### Mobile App Setup
```bash
cd mobile-app/MomentoApp
npm install
npx expo start
```

## Tech Stack
- **Mobile**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI/UX**: Premium glassmorphism design
- **AI Integration**: OpenAI GPT-4 via MCP servers
- **Database**: Normalized PostgreSQL with JSONB flexibility

## Current Status
✅ **Complete MCP Architecture** - Full system alignment verified
✅ **Mobile App** - Comprehensive onboarding flow implemented  
✅ **Database Schema** - Normalized, scalable, MCP-ready structure
🚧 **LLM Integration** - Next phase: Mission generation system

*See [FINAL_ALIGNMENT_REPORT.md](./FINAL_ALIGNMENT_REPORT.md) for complete technical documentation.*
# Momento
