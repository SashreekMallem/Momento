# Momento — AI Personal Memory OS

Your life, queryable. Momento is a mobile app for journaling, time capsules, life chapters, and mission tracking — with an MCP bridge server that lets LLM tools like Claude query your memory context across sessions via semantic retrieval.

## What makes it different

Most journal apps are write-only. You record things and never find them again. Momento treats your memories as a structured, searchable database. The MCP server means your AI assistant can actually retrieve context from your life when it needs it.

## Architecture

```
Mobile app (Expo) → Supabase (Postgres + pgvector)
                              ↕
                    MCP Bridge Server (Node.js)
                              ↕
              Claude / ChatGPT / any MCP-compatible LLM
```

The MCP bridge server exposes your memory store as tool calls. When an LLM needs context about your past — goals you set, decisions you made, moments you logged — it queries the bridge, which runs a pgvector semantic similarity search and returns relevant entries.

## Tech stack

- **Mobile** — Expo (React Native), TypeScript, cross-platform iOS + Android
- **Backend** — Supabase (Postgres 17 + pgvector + Auth + Storage)
- **MCP server** — Node.js, Model Context Protocol, semantic retrieval
- **AI** — OpenAI embeddings for memory indexing, vector similarity search

## Key features

- Journal entries with rich context tagging
- Time capsules — write to your future self
- Life chapters — structured periods with reflections
- Mission tracking — long-horizon goals with progress markers
- Semantic memory search — find entries by meaning, not just keywords
- MCP server — expose your memory to any LLM as tool calls

## MCP integration

See `docs/mcp-architecture.md` and `docs/mcp-integration/` for full details on connecting the bridge server to Claude or other MCP-compatible clients.
