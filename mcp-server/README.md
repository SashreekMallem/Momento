# Momento MCP Server

An advanced Model Context Protocol (MCP) server for Momento, providing AI-powered mission generation, user personalization, and behavioral analytics.

## Features

- **AI-Powered Mission Generation**: Create personalized life experiences using OpenAI GPT-4 and Anthropic Claude
- **Complete User Profiling**: Access comprehensive user data including preferences, relationships, and behavioral patterns
- **Advanced Analytics**: Deep behavioral analysis and personalization insights
- **Personalization Engine**: Intelligent adaptation based on user engagement and preferences
- **Mission Recommendations**: Smart suggestions based on user profile and history

## Architecture

The MCP server consists of four core services:

### 1. DatabaseService
- Manages all Supabase database interactions
- Handles user profiles, missions, events, and behavioral patterns
- Provides CRUD operations for all data entities

### 2. MissionGenerator
- Generates personalized missions using AI (OpenAI/Anthropic)
- Creates contextual prompts based on user data
- Provides fallback template-based generation
- Tracks generation costs and performance metrics

### 3. PersonalizationEngine
- Analyzes user data to create comprehensive profiles
- Generates personality insights and preferences
- Adapts user experience based on behavioral patterns
- Calculates personalization scores

### 4. AnalyticsService
- Performs deep behavioral analysis
- Tracks engagement patterns and consistency
- Generates actionable insights and recommendations
- Provides personalization reports

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DEFAULT_MISSION_MODEL=gpt-4-turbo-preview
FALLBACK_MISSION_MODEL=claude-3-sonnet-20240229
```

4. Build the server:
```bash
npm run build
```

## Usage

### As MCP Server

Run the server in MCP mode:
```bash
npm start
```

### Available Tools

#### 1. generate_mission

Generate a personalized mission for a user.

**Parameters:**
- `userId` (string, required): User UUID
- `preferences` (object, optional):
  - `missionType` (string): Type of mission (experience, connection, creativity, etc.)
  - `difficulty` (string): beginner, intermediate, or advanced
  - `duration` (number): Desired duration in minutes (5-480)
  - `context` (string): Additional context or requirements

**Example:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "preferences": {
    "missionType": "connection",
    "difficulty": "intermediate",
    "duration": 45,
    "context": "Something involving music and family"
  }
}
```

#### 2. get_user_profile

Retrieve comprehensive user profile and insights.

**Parameters:**
- `userId` (string, required): User UUID

**Returns:**
- Complete user profile with relationships, preferences, and behavioral insights
- Personality traits and activity preferences
- Social and time preferences
- Engagement patterns and performance metrics

#### 3. update_user_preferences

Update user preferences and trigger personalization recalculation.

**Parameters:**
- `userId` (string, required): User UUID
- `preferences` (object, required): New preference data

#### 4. analyze_user_behavior

Perform deep behavioral analysis and generate insights.

**Parameters:**
- `userId` (string, required): User UUID
- `timeRange` (string, optional): 'week', 'month', or 'year' (default: 'month')

**Returns:**
- Engagement metrics and patterns
- Behavioral consistency scores
- Growth trajectory analysis
- Actionable recommendations

#### 5. get_mission_recommendations

Get AI-powered mission recommendations.

**Parameters:**
- `userId` (string, required): User UUID
- `count` (number, optional): Number of recommendations (1-10, default: 3)

## Development

### Running in Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Project Structure

```
src/
├── index.ts              # Main MCP server implementation
├── services/
│   ├── database.ts       # Supabase database service
│   ├── enhanced-mission-generator.ts  # AI mission generation (current)
│   ├── personalization.ts   # User personalization engine
│   └── analytics.ts      # Behavioral analytics service
└── types/                # TypeScript type definitions
```

## AI Integration

### Mission Generation Process

1. **Context Gathering**: Collect comprehensive user data including:
   - Profile information and life themes
   - Important relationships and interests
   - Taste preferences (music, food, movies)
   - Mission performance history
   - Behavioral patterns

2. **Prompt Engineering**: Create detailed prompts that include:
   - User context and personalization data
   - Mission preferences and constraints
   - Learning objectives and skill reinforcement
   - Completion likelihood optimization

3. **AI Generation**: Use OpenAI GPT-4 or Anthropic Claude to generate:
   - Personalized mission titles and descriptions
   - Appropriate difficulty and duration
   - Required resources and learning objectives
   - Engagement and completion predictions

4. **Quality Assurance**: Validate generated missions for:
   - Alignment with user preferences
   - Realistic completion expectations
   - Appropriate difficulty scaling
   - Resource availability

### Personalization Engine

The personalization engine analyzes user data to create insights:

- **Personality Traits**: Inferred from life themes, preferences, and behavior
- **Activity Preferences**: Based on taste data and mission performance
- **Social Preferences**: Derived from relationship data and couple/family modes
- **Time Preferences**: Extracted from behavioral patterns and stated preferences
- **Engagement Patterns**: Calculated from mission completion and feedback data

## Database Schema Integration

The MCP server integrates with a comprehensive PostgreSQL schema including:

- **user_profiles**: Core user data and preferences
- **people**: Important relationships and connections
- **music_tastes**, **food_tastes**, **movie_tastes**: Preference data
- **missions**: Generated missions and performance tracking
- **user_events**: Behavioral event tracking
- **behavioral_patterns**: AI-identified user patterns
- **mission_feedback**: User feedback and ratings

## Error Handling

The server implements comprehensive error handling:

- **Validation Errors**: Zod schema validation for all inputs
- **Database Errors**: Graceful handling of Supabase connection issues
- **AI API Errors**: Fallback generation when AI services are unavailable
- **MCP Protocol Errors**: Proper error codes and messages for client consumption

## Performance Optimization

- **Parallel Processing**: Concurrent data fetching for user context
- **Caching**: Behavioral pattern caching for repeated requests
- **Connection Pooling**: Efficient database connection management
- **Rate Limiting**: Built-in protection against API abuse

## Security

- **Service Role Authentication**: Secure Supabase service role access
- **Input Validation**: Comprehensive validation of all inputs
- **Error Sanitization**: Prevented sensitive data leakage in error messages
- **API Key Management**: Secure handling of AI service credentials

## Monitoring and Analytics

- **Generation Tracking**: Monitor AI generation costs and performance
- **User Engagement**: Track mission completion and user satisfaction
- **System Health**: Database connection and API availability monitoring
- **Performance Metrics**: Response times and resource utilization tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with comprehensive tests
4. Submit a pull request with detailed description

## License

MIT License - see LICENSE file for details
