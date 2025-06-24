import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
export class MissionGenerator {
    openai;
    anthropic;
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
        // Initialize AI clients
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
        }
    }
    async generateMission(userId, preferences) {
        // Gather user context
        const userContext = await this.gatherUserContext(userId);
        // Generate mission using AI
        const missionData = await this.generateMissionWithAI(userContext, preferences);
        // Create mission in database
        const mission = await this.databaseService.createMission({
            user_id: userId,
            title: missionData.title,
            description: missionData.description,
            mission_type: missionData.mission_type || missionData.type, // Handle both field names
            mission_category: missionData.mission_category || missionData.category, // Handle both field names
            difficulty: missionData.difficulty,
            estimated_duration: missionData.estimated_duration || missionData.estimatedDuration,
            required_resources: missionData.required_resources || missionData.requiredResources || [],
            scheduling_flexibility: missionData.scheduling_flexibility || missionData.schedulingFlexibility || 'flexible',
            learning_objectives: missionData.learning_objectives || missionData.learningObjectives || [],
            skills_reinforced: missionData.skills_reinforced || missionData.skillsReinforced || [],
            status: 'generated',
            personalized_elements: missionData.personalized_elements || missionData.personalizedElements,
            generation_model: missionData.model,
            prompt_version: '1.0',
            context_snapshot: userContext,
            generation_cost: missionData.cost,
            engagement_score: missionData.engagement_score || missionData.engagementScore,
            completion_likelihood: missionData.completion_likelihood || missionData.completionLikelihood,
        });
        if (!mission) {
            throw new Error('Failed to create mission in database');
        }
        return mission;
    }
    async getRecommendations(userId, count = 3) {
        const userContext = await this.gatherUserContext(userId);
        return this.generateRecommendationsWithAI(userContext, count);
    }
    async gatherUserContext(userId) {
        const [profile, people, tastes, missionStats, behavioralPatterns, recentEvents] = await Promise.all([
            this.databaseService.getUserProfile(userId),
            this.databaseService.getUserPeople(userId),
            this.databaseService.getUserTastes(userId),
            this.databaseService.getUserMissionStats(userId),
            this.databaseService.getBehavioralPatterns(userId),
            this.databaseService.getUserEvents(userId, 'month'),
        ]);
        return {
            profile,
            people,
            tastes,
            missionStats,
            behavioralPatterns,
            recentActivity: recentEvents,
            timestamp: new Date().toISOString(),
        };
    }
    async generateMissionWithAI(userContext, preferences) {
        const prompt = this.buildMissionGenerationPrompt(userContext, preferences);
        try {
            // Try OpenAI first
            if (this.openai) {
                return await this.generateWithOpenAI(prompt);
            }
            // Fallback to Anthropic
            if (this.anthropic) {
                return await this.generateWithAnthropic(prompt);
            }
            throw new Error('No AI provider configured');
        }
        catch (error) {
            console.error('AI generation failed:', error);
            // Return a fallback mission
            return this.generateFallbackMission(userContext, preferences);
        }
    }
    buildMissionGenerationPrompt(userContext, preferences) {
        const { profile, people, tastes } = userContext;
        // Get focused, theme-based data instead of dumping everything
        const focusedData = this.getFocusedDataForMission(userContext, preferences);
        const missionType = preferences?.missionType || 'experience';
        const difficulty = preferences?.difficulty || 'beginner';
        const duration = preferences?.duration || 45;
        // Build a theme-focused prompt based on Momento's 6 life themes
        return `Create ONE specific, actionable mission based on the user's PRIMARY LIFE THEME.

MOMENTO'S 6 LIFE THEMES:
1. Adventure Awaits 🌟 - Exploration, discovery, trying new things
2. Deep Connections 💕 - Meaningful relationships, quality time with loved ones
3. Endless Growth 🌱 - Personal development, learning, skill building
4. Acts of Love ✨ - Kindness, giving back, helping others
5. Inner Peace 🌙 - Reflection, mindfulness, emotional well-being
6. Radiant Health 🌸 - Physical wellness, mental health, self-care

USER CONTEXT:
${focusedData.contextSummary}

MISSION REQUIREMENTS:
- Type: ${missionType}
- Duration: ${duration} minutes
- Difficulty: ${difficulty}
- Primary Life Theme: ${focusedData.primaryTheme}
- Social Context: ${focusedData.socialContext}

THEME-SPECIFIC MISSION EXAMPLES:

ADVENTURE missions: "Visit a local neighborhood you've never explored", "Try a new coffee shop and strike up a conversation"
RELATIONSHIPS missions: "Write a handwritten thank-you note to your friend Sarah", "Plan a surprise 15-minute activity for your partner"
GROWTH missions: "Learn 5 words in a language you're curious about", "Practice a skill you've been avoiding for 20 minutes"
KINDNESS missions: "Leave an encouraging note for a coworker", "Text someone who might need support today"
REFLECTION missions: "Journal about what you're grateful for right now", "Take a mindful 10-minute walk without your phone"
WELLNESS missions: "Do a 15-minute stretching routine", "Prepare a nourishing snack mindfully"

Generate a mission that is:
1. SPECIFIC to the PRIMARY LIFE THEME (${focusedData.primaryTheme})
2. ACHIEVABLE in ${duration} minutes
3. MEANINGFUL (creates a real moment, not just a task)
4. ACTIONABLE (clear next steps)

Respond in this exact JSON format:
{
  "title": "Theme-Specific Action Title",
  "description": "Clear description focused on the life theme, creating a meaningful moment",
  "mission_type": "${missionType}",
  "mission_category": "${focusedData.socialContext}",
  "difficulty": "${difficulty}",
  "estimated_duration": ${duration},
  "required_resources": ["specific", "needed", "items"],
  "learning_objectives": ["what meaningful outcome this creates for their life theme"],
  "personalized_elements": {
    "life_theme": "${focusedData.primaryTheme}",
    "social_context": "${focusedData.socialContext}",
    "why_meaningful": "explanation of how this mission creates a meaningful moment"
  }
}`;
    }
    // New focused data selection method based on LIFE THEMES, not just food/music
    getFocusedDataForMission(userContext, preferences) {
        const { profile, people, tastes } = userContext;
        const missionType = preferences?.missionType || 'experience';
        // Get life themes - this is what drives Momento missions
        const lifeThemes = profile?.life_themes?.selectedThemes || [];
        const coupleHub = profile?.life_themes?.coupleHub;
        const familyMode = profile?.life_themes?.familyMode;
        // Select a PRIMARY life theme to focus this mission on
        const primaryTheme = lifeThemes.length > 0
            ? lifeThemes[Math.floor(Math.random() * lifeThemes.length)]
            : 'growth'; // Default to growth
        // Build context based on the PRIMARY LIFE THEME, not just food preferences
        let themeContext = this.getThemeSpecificContext(primaryTheme, userContext);
        // Determine social context
        let socialContext = 'solo';
        if (coupleHub && familyMode) {
            socialContext = Math.random() > 0.5 ? 'couple' : 'family';
        }
        else if (coupleHub) {
            socialContext = Math.random() > 0.7 ? 'couple' : 'solo';
        }
        else if (familyMode) {
            socialContext = Math.random() > 0.7 ? 'family' : 'solo';
        }
        return {
            contextSummary: `Primary life theme: ${primaryTheme}. ${themeContext} Social context: ${socialContext}.`,
            primaryTheme,
            socialContext
        };
    }
    // Generate context based on the specific life theme
    getThemeSpecificContext(theme, userContext) {
        const { people, tastes } = userContext;
        switch (theme) {
            case 'adventure':
                // Focus on exploration, trying new things
                return 'Seeks new experiences and discoveries.';
            case 'relationships':
                // Focus on meaningful connections
                const importantPeople = people || [];
                if (importantPeople.length > 0) {
                    const randomPerson = importantPeople[Math.floor(Math.random() * importantPeople.length)];
                    return `Has a ${randomPerson.relationship.toLowerCase()} named ${randomPerson.name} who matters to them.`;
                }
                return 'Values deep, meaningful relationships.';
            case 'growth':
                // Focus on learning and development
                return 'Committed to personal development and learning new skills.';
            case 'kindness':
                // Focus on giving back and helping others
                return 'Believes in making a positive impact through acts of kindness.';
            case 'reflection':
                // Focus on mindfulness and inner peace
                return 'Values quiet reflection and inner peace.';
            case 'wellness':
                // Focus on physical and mental health
                return 'Prioritizes physical and mental well-being.';
            default:
                return 'Seeks meaningful experiences that align with their values.';
        }
    }
    determineMissionCategory(profile, people) {
        const coupleHub = profile?.life_themes?.coupleHub;
        const familyMode = profile?.life_themes?.familyMode;
        if (coupleHub && familyMode) {
            // Random choice between couple and family
            return Math.random() > 0.5 ? 'couple' : 'family';
        }
        else if (coupleHub) {
            return Math.random() > 0.3 ? 'couple' : 'solo'; // 70% couple, 30% solo
        }
        else if (familyMode) {
            return Math.random() > 0.3 ? 'family' : 'solo'; // 70% family, 30% solo
        }
        else {
            return 'solo';
        }
    }
    async generateWithOpenAI(prompt) {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }
        const completion = await this.openai.chat.completions.create({
            model: process.env.DEFAULT_MISSION_MODEL || 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a mission generation AI for Momento. Respond only with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content generated');
        }
        const missionData = JSON.parse(content);
        return {
            ...missionData,
            model: completion.model,
            cost: this.calculateOpenAICost(completion.usage?.total_tokens || 0),
        };
    }
    async generateWithAnthropic(prompt) {
        if (!this.anthropic) {
            throw new Error('Anthropic client not initialized');
        }
        const message = await this.anthropic.messages.create({
            model: process.env.FALLBACK_MISSION_MODEL || 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = message.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type');
        }
        const missionData = JSON.parse(content.text);
        return {
            ...missionData,
            model: message.model,
            cost: this.calculateAnthropicCost(message.usage.input_tokens + message.usage.output_tokens),
        };
    }
    generateFallbackMission(userContext, preferences) {
        const { profile, people, tastes } = userContext;
        // Create a simple template-based mission
        const missions = [
            {
                title: "Connect with a loved one",
                description: "Reach out to someone important and have a meaningful conversation",
                type: "connection",
                category: people.length > 0 ? "friends" : "solo",
            },
            {
                title: "Try something creative",
                description: "Express yourself through art, music, or writing for 30 minutes",
                type: "creativity",
                category: "solo",
            },
            {
                title: "Learn something new",
                description: "Spend time learning about a topic that interests you",
                type: "learning",
                category: "solo",
            },
        ];
        const selectedMission = missions[Math.floor(Math.random() * missions.length)];
        return {
            ...selectedMission,
            difficulty: preferences?.difficulty || 'beginner',
            estimatedDuration: preferences?.duration || 30,
            personalizedElements: {
                people: people.slice(0, 2).map((p) => p.name),
                interests: [
                    ...(tastes.music?.genres || []).slice(0, 2),
                    ...(tastes.food?.cuisines || []).slice(0, 2),
                ],
                preferences: profile?.life_themes?.selectedThemes || [],
                timeContext: 'flexible',
            },
            learningObjectives: ['Personal growth', 'Self-discovery'],
            skillsReinforced: ['Communication', 'Creativity'],
            requiredResources: ['Time', 'Open mind'],
            schedulingFlexibility: 'flexible',
            engagementScore: 0.7,
            completionLikelihood: 0.8,
            model: 'fallback-template',
            cost: 0,
        };
    }
    async generateRecommendationsWithAI(userContext, count) {
        const prompt = `
# Momento Mission Recommendations

Generate ${count} personalized mission recommendations for this user based on their profile.

${this.buildMissionGenerationPrompt(userContext, undefined)}

## Response Format (JSON only):
{
  "recommendations": [
    {
      "title": "Mission title",
      "description": "Brief description",
      "type": "mission type",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedDuration": 30,
      "confidence": 0.85,
      "reasoning": "Why this mission fits the user"
    }
  ]
}`;
        try {
            if (this.openai) {
                const completion = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'Generate mission recommendations as JSON.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.8,
                    max_tokens: 1500,
                });
                const content = completion.choices[0]?.message?.content;
                if (content) {
                    const result = JSON.parse(content);
                    return result.recommendations;
                }
            }
        }
        catch (error) {
            console.error('AI recommendation generation failed:', error);
        }
        // Fallback recommendations
        return [
            {
                title: "Daily gratitude practice",
                description: "Reflect on three things you're grateful for today",
                type: "reflection",
                difficulty: "beginner",
                estimatedDuration: 10,
                confidence: 0.9,
                reasoning: "Simple practice that builds positive mindset",
            },
            {
                title: "Connect with a friend",
                description: "Send a thoughtful message to someone you care about",
                type: "connection",
                difficulty: "beginner",
                estimatedDuration: 15,
                confidence: 0.8,
                reasoning: "Strengthens relationships and brings joy",
            },
            {
                title: "Creative expression time",
                description: "Spend 20 minutes on any creative activity you enjoy",
                type: "creativity",
                difficulty: "intermediate",
                estimatedDuration: 20,
                confidence: 0.7,
                reasoning: "Nurtures self-expression and personal growth",
            },
        ].slice(0, count);
    }
    // Helper methods for comprehensive user data analysis
    buildAdvancedMusicProfile(musicTastes) {
        if (!musicTastes)
            return "No music preferences specified";
        const profile = [];
        // Core preferences
        if (musicTastes.genres?.length) {
            profile.push(`Genres: ${musicTastes.genres.join(', ')}`);
        }
        if (musicTastes.favorite_artists?.length) {
            profile.push(`Artists: ${musicTastes.favorite_artists.join(', ')}`);
        }
        // Advanced listening patterns
        if (musicTastes.listening_times?.length) {
            profile.push(`Listens during: ${musicTastes.listening_times.join(', ')}`);
        }
        if (musicTastes.discovery_methods?.length) {
            profile.push(`Discovers music via: ${musicTastes.discovery_methods.join(', ')}`);
        }
        if (musicTastes.mood_music_mapping) {
            const moods = Object.entries(musicTastes.mood_music_mapping)
                .map(([mood, music]) => `${mood}: ${music}`)
                .join('; ');
            profile.push(`Mood preferences: ${moods}`);
        }
        if (musicTastes.concert_frequency) {
            profile.push(`Concert attendance: ${musicTastes.concert_frequency}`);
        }
        if (musicTastes.music_budget_range) {
            profile.push(`Music budget: ${musicTastes.music_budget_range}`);
        }
        return profile.length ? profile.join(' | ') : "Casual music listener";
    }
    buildAdvancedFoodProfile(foodTastes) {
        if (!foodTastes)
            return "No food preferences specified";
        const profile = [];
        // Core preferences
        if (foodTastes.cuisines?.length) {
            profile.push(`Cuisines: ${foodTastes.cuisines.join(', ')}`);
        }
        if (foodTastes.dietary_restrictions?.length) {
            profile.push(`Dietary needs: ${foodTastes.dietary_restrictions.join(', ')}`);
        }
        // Advanced dining patterns
        if (foodTastes.cooking_frequency) {
            profile.push(`Cooks: ${foodTastes.cooking_frequency}`);
        }
        if (foodTastes.preferred_dining_times?.length) {
            profile.push(`Dines out: ${foodTastes.preferred_dining_times.join(', ')}`);
        }
        if (foodTastes.dining_environments?.length) {
            profile.push(`Environment preferences: ${foodTastes.dining_environments.join(', ')}`);
        }
        if (foodTastes.food_budget_range) {
            profile.push(`Dining budget: ${foodTastes.food_budget_range}`);
        }
        if (foodTastes.food_discovery_methods?.length) {
            profile.push(`Discovers food via: ${foodTastes.food_discovery_methods.join(', ')}`);
        }
        if (foodTastes.allergies?.length) {
            profile.push(`Allergies: ${foodTastes.allergies.join(', ')}`);
        }
        return profile.length ? profile.join(' | ') : "Flexible eater";
    }
    buildAdvancedMovieProfile(movieTastes) {
        if (!movieTastes)
            return "No movie preferences specified";
        const profile = [];
        // Core preferences
        if (movieTastes.genres?.length) {
            profile.push(`Genres: ${movieTastes.genres.join(', ')}`);
        }
        if (movieTastes.favorite_directors?.length) {
            profile.push(`Directors: ${movieTastes.favorite_directors.join(', ')}`);
        }
        if (movieTastes.favorite_actors?.length) {
            profile.push(`Actors: ${movieTastes.favorite_actors.join(', ')}`);
        }
        // Advanced viewing patterns
        if (movieTastes.viewing_times?.length) {
            profile.push(`Watches during: ${movieTastes.viewing_times.join(', ')}`);
        }
        if (movieTastes.viewing_environments?.length) {
            profile.push(`Prefers: ${movieTastes.viewing_environments.join(', ')}`);
        }
        if (movieTastes.streaming_platforms?.length) {
            profile.push(`Platforms: ${movieTastes.streaming_platforms.join(', ')}`);
        }
        if (movieTastes.movie_discovery_methods?.length) {
            profile.push(`Discovers via: ${movieTastes.movie_discovery_methods.join(', ')}`);
        }
        if (movieTastes.movie_budget_range) {
            profile.push(`Movie budget: ${movieTastes.movie_budget_range}`);
        }
        if (movieTastes.subtitles_preference) {
            profile.push(`Subtitles: ${movieTastes.subtitles_preference}`);
        }
        return profile.length ? profile.join(' | ') : "Casual movie watcher";
    }
    buildRelationshipInsights(people) {
        if (!people?.length)
            return "No important people specified";
        const insights = [];
        // Relationship distribution
        const relationships = people.reduce((acc, person) => {
            acc[person.relationship] = (acc[person.relationship] || 0) + 1;
            return acc;
        }, {});
        const relationshipSummary = Object.entries(relationships)
            .map(([rel, count]) => `${count} ${rel}${count > 1 ? 's' : ''}`)
            .join(', ');
        insights.push(`Network: ${relationshipSummary}`);
        // Shared interests analysis
        const allInterests = people.flatMap((p) => p.person_interests?.map((i) => i.interest) || []);
        const commonInterests = allInterests.reduce((acc, interest) => {
            acc[interest] = (acc[interest] || 0) + 1;
            return acc;
        }, {});
        const topSharedInterests = Object.entries(commonInterests)
            .filter(([, count]) => count > 1)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([interest]) => interest);
        if (topSharedInterests.length) {
            insights.push(`Shared interests: ${topSharedInterests.join(', ')}`);
        }
        // Important dates coming up
        const upcomingDates = people.flatMap((p) => p.important_dates?.map((d) => ({
            person: p.name,
            type: d.date_type,
            date: d.date_value,
            relationship: p.relationship
        })) || []);
        if (upcomingDates.length) {
            insights.push(`Upcoming events: ${upcomingDates.length} important dates tracked`);
        }
        // Most connected person (for mission suggestions)
        const mostConnected = people.reduce((max, person) => {
            const connectionScore = (person.person_interests?.length || 0) +
                (person.important_dates?.length || 0);
            return connectionScore > (max.score || 0) ?
                { person: person.name, relationship: person.relationship, score: connectionScore } : max;
        }, {});
        if (mostConnected.person) {
            insights.push(`Key connection: ${mostConnected.person} (${mostConnected.relationship})`);
        }
        return insights.join(' | ');
    }
    getPreferredDifficulty(missionStats) {
        if (!missionStats?.difficultyStats)
            return 'beginner';
        const { difficultyStats } = missionStats;
        const sorted = Object.entries(difficultyStats)
            .sort(([, a], [, b]) => b - a);
        return sorted[0]?.[0] || 'beginner';
    }
    getTypicalEngagementTime(behavioralPatterns) {
        if (!behavioralPatterns)
            return '30-45 minutes';
        // Analyze typical session lengths, preferred times, etc.
        const avgDuration = behavioralPatterns.average_session_duration || 30;
        if (avgDuration < 20)
            return '15-20 minutes (quick sessions)';
        if (avgDuration < 45)
            return '30-45 minutes (moderate focus)';
        if (avgDuration < 90)
            return '45-90 minutes (deep engagement)';
        return '90+ minutes (extended focus)';
    }
    getDiscoveryStyle(tastes) {
        const discoveryMethods = [];
        // Aggregate discovery methods across all taste categories
        if (tastes?.music?.discovery_methods?.length) {
            discoveryMethods.push(...tastes.music.discovery_methods);
        }
        if (tastes?.food?.food_discovery_methods?.length) {
            discoveryMethods.push(...tastes.food.food_discovery_methods);
        }
        if (tastes?.movies?.movie_discovery_methods?.length) {
            discoveryMethods.push(...tastes.movies.movie_discovery_methods);
        }
        // Find most common discovery pattern
        const methodCounts = discoveryMethods.reduce((acc, method) => {
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});
        const topMethod = Object.entries(methodCounts)
            .sort(([, a], [, b]) => b - a)[0];
        if (topMethod) {
            const [method, count] = topMethod;
            return `${method} (${count > 1 ? 'consistent across interests' : 'preferred method'})`;
        }
        return 'Exploratory (no strong pattern)';
    }
    calculateOpenAICost(tokens) {
        // Rough estimate: GPT-4o-mini costs ~$0.0002/1K tokens (much cheaper for testing)
        return (tokens / 1000) * 0.01;
    }
    calculateAnthropicCost(tokens) {
        // Rough estimate: Claude-3 Sonnet costs ~$0.003/1K tokens
        return (tokens / 1000) * 0.003;
    }
}
//# sourceMappingURL=mission-generator.js.map