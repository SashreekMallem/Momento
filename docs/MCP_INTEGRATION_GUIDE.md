# Momento MCP Integration Guide

## 🎉 Setup Complete!

Your Momento MCP server is ready for LLM integration with GPT-4o-mini (cheap model for testing).

## ✅ What's Ready

- **Database**: All migrations executed (except RLS policies)
- **MCP Server**: Built and configured with cheap model
- **Environment**: All API keys and configurations set
- **LLM Integration**: OpenAI GPT-4o-mini ready for mission generation

## 🚀 How to Use

### 1. Start the MCP Server
```bash
cd /Users/ms/Momento/mcp-server
npm start
```

### 2. Claude Desktop Integration

Add this to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "momento": {
      "command": "node",
      "args": ["/Users/ms/Momento/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://fjjjrieldehvywtxevhf.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-key-here",
        "OPENAI_API_KEY": "your-openai-key-here",
        "DEFAULT_MISSION_MODEL": "gpt-4o-mini"
      }
    }
  }
}
```

### 3. Available MCP Tools

Once connected, Claude can use these tools:

1. **generate_mission** - Create personalized missions
   - Parameters: userId, missionType, difficulty
   - Uses user's profile data for personalization

2. **get_user_profile** - Retrieve complete user profile
   - Parameters: userId
   - Returns life themes, people, preferences

3. **update_user_preferences** - Update user preferences
   - Parameters: userId, preferences
   - Updates taste and preference data

4. **get_user_analytics** - Get user engagement data
   - Parameters: userId, timeRange
   - Returns behavioral insights

## 🧪 Testing Commands

Once integrated with Claude, you can test with:

```
Generate a beginner experience mission for user test-user-123
```

```
Get the user profile for test-user-123
```

## 💰 Cost Optimization

Currently using **GPT-4o-mini** (~$0.0002/1K tokens) for testing.

When ready for production, update the model in `.env`:
```
DEFAULT_MISSION_MODEL=gpt-4-turbo-preview
```

## 🔧 Troubleshooting

**Server won't start?**
- Check environment variables with: `node simple-test.cjs`
- Verify database connection
- Check OpenAI API key validity

**No missions generated?**
- Ensure user has profile data in database
- Check API rate limits
- Verify model name is correct

## 📊 Monitoring

The server logs all:
- Mission generation requests
- User interactions
- Error messages
- Performance metrics

Ready for premium mobile app integration! 🚀
