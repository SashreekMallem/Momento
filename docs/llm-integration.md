# 🤖 LLM Integration & Data Flow

## Overview

This document defines the comprehensive LLM integration patterns, data flow architecture, and context management strategies for Momento's intelligent mission generation system. The system is designed to leverage user onboarding data to create highly personalized, contextually relevant life experiences.

## LLM Integration Architecture

### Multi-Model Strategy

Momento employs a sophisticated multi-model approach, selecting the optimal LLM for each specific task based on capabilities, cost, latency, and quality requirements.

```typescript
interface LLMProvider {
  name: string;
  model: string;
  capabilities: LLMCapability[];
  costTier: 'low' | 'medium' | 'high';
  latency: 'fast' | 'medium' | 'slow';
  contextWindow: number;
  multimodal: boolean;
  strengths: string[];
  idealUseCases: string[];
}

enum LLMCapability {
  CREATIVE_WRITING = 'creative_writing',
  LOGICAL_REASONING = 'logical_reasoning',
  EMOTIONAL_INTELLIGENCE = 'emotional_intelligence',
  CONTEXT_SYNTHESIS = 'context_synthesis',
  PERSONALIZATION = 'personalization',
  RAPID_GENERATION = 'rapid_generation',
  DETAIL_ORIENTED = 'detail_oriented',
  MULTI_TURN_CONVERSATION = 'multi_turn_conversation',
  CODE_GENERATION = 'code_generation',
  STRUCTURED_OUTPUT = 'structured_output'
}

const LLM_PROVIDERS: Record<string, LLMProvider> = {
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    model: 'gpt-4-turbo-preview',
    capabilities: [
      LLMCapability.CREATIVE_WRITING,
      LLMCapability.LOGICAL_REASONING,
      LLMCapability.PERSONALIZATION,
      LLMCapability.DETAIL_ORIENTED,
      LLMCapability.STRUCTURED_OUTPUT
    ],
    costTier: 'high',
    latency: 'medium',
    contextWindow: 128000,
    multimodal: true,
    strengths: ['Creative mission generation', 'Complex reasoning', 'Structured output'],
    idealUseCases: ['Complex personalized missions', 'Creative exploration missions', 'Multi-step planning']
  },
  
  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    model: 'claude-3-5-sonnet-20241022',
    capabilities: [
      LLMCapability.EMOTIONAL_INTELLIGENCE,
      LLMCapability.CONTEXT_SYNTHESIS,
      LLMCapability.PERSONALIZATION,
      LLMCapability.DETAIL_ORIENTED,
      LLMCapability.MULTI_TURN_CONVERSATION
    ],
    costTier: 'high',
    latency: 'medium',
    contextWindow: 200000,
    multimodal: true,
    strengths: ['Emotional nuance', 'Relationship understanding', 'Context synthesis'],
    idealUseCases: ['Relationship-building missions', 'Emotional wellness', 'Complex context analysis']
  },
  
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    model: 'gpt-3.5-turbo',
    capabilities: [
      LLMCapability.RAPID_GENERATION,
      LLMCapability.CREATIVE_WRITING,
      LLMCapability.STRUCTURED_OUTPUT
    ],
    costTier: 'low',
    latency: 'fast',
    contextWindow: 16000,
    multimodal: false,
    strengths: ['Fast generation', 'Cost-effective', 'Simple missions'],
    idealUseCases: ['Daily rituals', 'Simple reminders', 'Quick suggestions', 'A/B testing']
  },
  
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    model: 'gpt-4o-mini',
    capabilities: [
      LLMCapability.RAPID_GENERATION,
      LLMCapability.STRUCTURED_OUTPUT,
      LLMCapability.PERSONALIZATION
    ],
    costTier: 'low',
    latency: 'fast',
    contextWindow: 128000,
    multimodal: true,
    strengths: ['Balanced cost/performance', 'Good personalization', 'Structured output'],
    idealUseCases: ['Medium complexity missions', 'Preference analysis', 'Context extraction']
  }
};
```

### Model Selection Algorithm

```typescript
class LLMSelector {
  selectOptimalModel(request: MissionRequest, context: UserContextProfile): LLMProvider {
    const scores: Record<string, number> = {};
    
    for (const [providerId, provider] of Object.entries(LLM_PROVIDERS)) {
      let score = 0;
      
      // Capability matching (40% weight)
      const requiredCapabilities = this.getRequiredCapabilities(request);
      const capabilityMatch = this.calculateCapabilityMatch(requiredCapabilities, provider.capabilities);
      score += capabilityMatch * 0.4;
      
      // Context complexity (25% weight)
      const contextComplexity = this.assessContextComplexity(context);
      const complexityFit = this.assessComplexityFit(contextComplexity, provider);
      score += complexityFit * 0.25;
      
      // Performance requirements (20% weight)
      const performanceScore = this.assessPerformanceRequirements(request, provider);
      score += performanceScore * 0.2;
      
      // Cost efficiency (15% weight)
      const costScore = this.assessCostEfficiency(request, provider);
      score += costScore * 0.15;
      
      scores[providerId] = score;
    }
    
    // Select the highest scoring provider
    const bestProvider = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0][0];
    
    return LLM_PROVIDERS[bestProvider];
  }
  
  private getRequiredCapabilities(request: MissionRequest): LLMCapability[] {
    const capabilities: LLMCapability[] = [];
    
    switch (request.type) {
      case MissionType.CREATIVE_EXPLORATION:
        capabilities.push(LLMCapability.CREATIVE_WRITING, LLMCapability.PERSONALIZATION);
        break;
      case MissionType.RELATIONSHIP_BUILDING:
        capabilities.push(LLMCapability.EMOTIONAL_INTELLIGENCE, LLMCapability.PERSONALIZATION);
        break;
      case MissionType.DAILY_RITUAL:
        capabilities.push(LLMCapability.RAPID_GENERATION, LLMCapability.STRUCTURED_OUTPUT);
        break;
      case MissionType.SKILL_DEVELOPMENT:
        capabilities.push(LLMCapability.LOGICAL_REASONING, LLMCapability.DETAIL_ORIENTED);
        break;
      default:
        capabilities.push(LLMCapability.PERSONALIZATION);
    }
    
    if (request.complexity === 'high') {
      capabilities.push(LLMCapability.CONTEXT_SYNTHESIS, LLMCapability.DETAIL_ORIENTED);
    }
    
    return capabilities;
  }
  
  private assessContextComplexity(context: UserContextProfile): 'low' | 'medium' | 'high' {
    let complexityScore = 0;
    
    // Relationship complexity
    const peopleCount = context.relationships.importantPeople.length;
    if (peopleCount > 5) complexityScore += 2;
    else if (peopleCount > 2) complexityScore += 1;
    
    // Taste profile richness
    const tasteRichness = this.calculateTasteRichness(context.tastes);
    if (tasteRichness > 0.8) complexityScore += 2;
    else if (tasteRichness > 0.5) complexityScore += 1;
    
    // Behavioral pattern complexity
    if (context.behavior.spontaneityLevel < 3 || context.behavior.spontaneityLevel > 8) {
      complexityScore += 1; // Extreme preferences require more nuanced handling
    }
    
    // Life themes complexity
    if (context.lifeThemes.coupleMode || context.lifeThemes.familyMode) {
      complexityScore += 1; // Multi-person contexts are more complex
    }
    
    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }
}
```

## Prompt Engineering System

### Hierarchical Prompt Architecture

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  missionType: MissionType;
  complexity: 'simple' | 'medium' | 'complex';
  
  // Template structure
  systemPrompt: string;
  contextTemplate: string;
  instructionTemplate: string;
  exampleTemplate?: string;
  outputFormat: string;
  
  // Metadata
  createdAt: Date;
  performanceMetrics: PromptPerformanceMetrics;
  validationRules: ValidationRule[];
}

interface PromptPerformanceMetrics {
  averageRating: number;
  completionRate: number;
  relevanceScore: number;
  generationLatency: number;
  costEfficiency: number;
  userSatisfaction: number;
}

class PromptEngine {
  private templates: Map<string, PromptTemplate> = new Map();
  
  async buildMissionPrompt(
    context: UserContextProfile,
    request: MissionRequest,
    provider: LLMProvider
  ): Promise<string> {
    // 1. Select optimal template
    const template = await this.selectTemplate(request, provider);
    
    // 2. Build context section
    const contextSection = await this.buildContextSection(context, request, template);
    
    // 3. Build instruction section
    const instructionSection = await this.buildInstructionSection(request, template);
    
    // 4. Add examples if beneficial
    const exampleSection = await this.buildExampleSection(context, request, template);
    
    // 5. Compile final prompt
    return this.compilePrompt(template, contextSection, instructionSection, exampleSection);
  }
  
  private async buildContextSection(
    context: UserContextProfile,
    request: MissionRequest,
    template: PromptTemplate
  ): Promise<string> {
    const contextElements = [];
    
    // Personal identity (always included, anonymized)
    contextElements.push(`**Personal Context:**
- Life Stage: ${this.inferLifeStage(context)}
- Primary Themes: ${context.lifeThemes.primaryThemes.join(', ')}
- Time Commitment: ${context.lifeThemes.timeCommitment}
- Couple Mode: ${context.lifeThemes.coupleMode ? 'Yes' : 'No'}
- Family Mode: ${context.lifeThemes.familyMode ? 'Yes' : 'No'}`);
    
    // Relationship context (if relevant to mission type)
    if (this.isRelationshipRelevant(request.type)) {
      const relationshipContext = await this.buildRelationshipContext(context);
      contextElements.push(relationshipContext);
    }
    
    // Taste preferences (if relevant)
    if (this.isTasteRelevant(request.type, request.category)) {
      const tasteContext = await this.buildTasteContext(context, request);
      contextElements.push(tasteContext);
    }
    
    // Behavioral patterns
    contextElements.push(`**Behavioral Preferences:**
- Preferred Times: ${context.behavior.preferredTimes.join(', ')}
- Spontaneity Level: ${context.behavior.spontaneityLevel}/10
- Planning Horizon: ${context.behavior.planningHorizon}
- Activity Level: ${this.inferActivityLevel(context)}`);
    
    // Current context & timing
    const currentContext = await this.buildCurrentContext(context, request);
    contextElements.push(currentContext);
    
    return contextElements.join('\n\n');
  }
  
  private async buildRelationshipContext(context: UserContextProfile): Promise<string> {
    const people = context.relationships.importantPeople.slice(0, 5); // Top 5 most important
    
    if (people.length === 0) {
      return `**Relationship Context:**
- Currently focusing on personal growth and individual experiences
- Open to meeting new people and building connections`;
    }
    
    const relationshipDescriptions = people.map(person => {
      const interests = person.interests.length > 0 
        ? ` (interested in: ${person.interests.slice(0, 3).join(', ')})` 
        : '';
      return `- ${person.relationship}: ${person.name}${interests}`;
    });
    
    return `**Relationship Context:**
Important people in their life:
${relationshipDescriptions.join('\n')}

Relationship dynamics: ${this.analyzeRelationshipDynamics(people)}`;
  }
  
  private async buildTasteContext(
    context: UserContextProfile,
    request: MissionRequest
  ): Promise<string> {
    const tasteElements = [];
    
    // Music preferences (if relevant)
    if (request.category === MissionCategory.CREATIVE_EXPRESSION || 
        request.category === MissionCategory.TASTE_EXPLORATION) {
      const musicTastes = context.tastes.music;
      if (musicTastes && musicTastes.genres.length > 0) {
        tasteElements.push(`**Music Preferences:**
- Favorite Genres: ${musicTastes.genres.slice(0, 4).join(', ')}
- Artists: ${musicTastes.favoriteArtists.slice(0, 3).join(', ')}
- Moods: ${musicTastes.musicMoods.slice(0, 3).join(', ')}
- Discovery Openness: ${this.mapDiscoveryOpenness(musicTastes.discoveryOpenness || 5)}`);
      }
    }
    
    // Food preferences (if relevant)
    if (request.category === MissionCategory.TASTE_EXPLORATION ||
        request.category === MissionCategory.ADVENTURE_DISCOVERY) {
      const foodTastes = context.tastes.food;
      if (foodTastes && foodTastes.cuisines.length > 0) {
        tasteElements.push(`**Food Preferences:**
- Favorite Cuisines: ${foodTastes.cuisines.slice(0, 4).join(', ')}
- Dietary Considerations: ${foodTastes.dietaryRestrictions.join(', ') || 'None specified'}
- Spice Tolerance: ${foodTastes.spiceTolerance || 'Moderate'}
- Discovery Openness: ${this.mapDiscoveryOpenness(foodTastes.discoveryOpenness || 5)}`);
      }
    }
    
    // Movie preferences (if relevant)
    if (request.category === MissionCategory.CREATIVE_EXPRESSION ||
        request.category === MissionCategory.CULTURAL_DISCOVERY) {
      const movieTastes = context.tastes.movies;
      if (movieTastes && movieTastes.genres.length > 0) {
        tasteElements.push(`**Entertainment Preferences:**
- Movie Genres: ${movieTastes.genres.slice(0, 4).join(', ')}
- Favorite Directors: ${movieTastes.favoriteDirectors.slice(0, 2).join(', ')}
- Preferred Decades: ${movieTastes.favoriteDecades.slice(0, 2).join(', ')}
- Content Preferences: ${this.analyzeContentPreferences(movieTastes)}`);
      }
    }
    
    return tasteElements.join('\n\n');
  }
  
  private async buildCurrentContext(
    context: UserContextProfile,
    request: MissionRequest
  ): Promise<string> {
    const now = new Date();
    const timeContext = this.getTimeContext(now, context.identity.timezone);
    const seasonContext = this.getSeasonContext(now, context.identity.location);
    
    return `**Current Context:**
- Time: ${timeContext.description}
- Season: ${seasonContext.season} (${seasonContext.description})
- Location Context: ${context.identity.location.city}, ${context.identity.location.country}
- Mission Timing: ${request.schedulingPreference || 'Flexible'}`;
  }
}
```

### Prompt Templates by Mission Type

#### Creative Exploration Template

```typescript
const CREATIVE_EXPLORATION_TEMPLATE: PromptTemplate = {
  id: 'creative-exploration-v2.1',
  name: 'Creative Exploration Mission',
  version: '2.1',
  missionType: MissionType.CREATIVE_EXPLORATION,
  complexity: 'medium',
  
  systemPrompt: `You are Momento's Mission Generator, an expert at creating personalized, meaningful life experiences that spark creativity and personal growth. Your role is to generate creative exploration missions that are:

1. **Personally Relevant**: Deeply connected to the user's interests, relationships, and current life context
2. **Creatively Inspiring**: Designed to spark imagination, artistic expression, or creative thinking
3. **Achievable**: Realistic given their time commitment and skill level
4. **Meaningful**: Contributing to their broader life themes and personal growth
5. **Engaging**: Written in an inspiring, warm, and encouraging tone

Important Guidelines:
- Always use the person's actual interests and relationships to personalize the mission
- Make the mission feel like a natural next step in their creative journey
- Include specific, actionable steps that build toward a meaningful outcome
- Consider their time commitment and complexity preferences
- Write in second person ("you") with an encouraging, friendly tone
- End with a reflection prompt that connects the activity to their broader growth`,
  
  contextTemplate: `{CONTEXT_SECTION}`,
  
  instructionTemplate: `Based on this context, create a creative exploration mission that:

**Mission Requirements:**
- Duration: {ESTIMATED_DURATION} minutes
- Difficulty: {DIFFICULTY_LEVEL}
- Creative Focus: {CREATIVE_FOCUS}
- Incorporates: {PERSONALIZATION_ELEMENTS}

**Output Format:**
Generate a mission with this exact structure:

**Title:** [Compelling, personalized title that sparks curiosity]

**Description:** [2-3 engaging paragraphs that:
- Set up the creative challenge in an inspiring way
- Connect to their specific interests and context
- Explain the value and potential impact]

**Your Mission:**
[Numbered list of 3-5 specific, actionable steps that:
- Build progressively toward the creative goal
- Include personal touches based on their context
- Are clear and achievable within the time limit]

**Materials Needed:**
[Simple list of required materials/resources]

**Reflection Prompt:**
[A thoughtful question that helps them connect this experience to their broader creative growth and life themes]

**Why This Matters:**
[1-2 sentences connecting this mission to their personal growth journey]`,
  
  exampleTemplate: `**Example Mission:**

**Title:** "Create a Musical Memory Map with Sarah"

**Description:** 
Music has this incredible power to transport us through time and connect us with the people we love. Today, you're going to create something beautiful that celebrates both your love for indie folk music and your close friendship with Sarah. This mission combines your artistic side with your deep appreciation for meaningful relationships.

You'll be creating a "Musical Memory Map" – a creative piece that maps out significant moments in your friendship through the songs that defined them. This isn't just about making a playlist; it's about creating a visual, emotional journey that honors your connection.

**Your Mission:**
1. Set up your creative space with some of your favorite indie folk music playing softly in the background
2. Gather 5-7 significant memories you share with Sarah, from when you first met to recent adventures
3. For each memory, identify a song that captures that moment's feeling (could be a song you listened to together, or one that just feels right for that memory)
4. Create a visual map connecting these memories and songs – use drawings, colors, words, whatever feels authentic to you
5. Write a short note to Sarah explaining one of the memories and why you chose that particular song for it

**Materials Needed:**
- Large paper or poster board
- Colored pens, markers, or pencils
- Your music streaming app
- A quiet, comfortable space

**Reflection Prompt:**
How did revisiting these memories through music help you appreciate the depth of your friendship? What did you discover about how music has shaped your shared experiences?

**Why This Matters:**
This mission strengthens your creative expression while deepening your connection with someone important to you – exactly the kind of meaningful experience that enriches your life's tapestry.`,
  
  outputFormat: 'structured_mission',
  
  createdAt: new Date('2024-12-01'),
  performanceMetrics: {
    averageRating: 4.7,
    completionRate: 0.82,
    relevanceScore: 4.8,
    generationLatency: 2.3,
    costEfficiency: 0.85,
    userSatisfaction: 4.6
  },
  
  validationRules: [
    { field: 'title', rule: 'length_between', params: [10, 80] },
    { field: 'description', rule: 'paragraph_count_between', params: [2, 3] },
    { field: 'mission_steps', rule: 'step_count_between', params: [3, 6] },
    { field: 'personalization', rule: 'includes_user_context', params: ['name', 'interest'] }
  ]
};
```

#### Relationship Building Template

```typescript
const RELATIONSHIP_BUILDING_TEMPLATE: PromptTemplate = {
  id: 'relationship-building-v2.0',
  name: 'Relationship Building Mission',
  version: '2.0',
  missionType: MissionType.RELATIONSHIP_BUILDING,
  complexity: 'medium',
  
  systemPrompt: `You are Momento's Relationship Mission Generator, specialized in creating meaningful experiences that strengthen human connections. Your missions help people deepen existing relationships and build new ones through thoughtful, personalized activities.

Core Principles:
1. **Authentic Connection**: Focus on genuine interaction and emotional intimacy
2. **Mutual Benefit**: Ensure the experience enriches both/all participants
3. **Comfort Zone Respect**: Honor boundaries while encouraging gentle growth
4. **Cultural Sensitivity**: Consider diverse relationship styles and communication preferences
5. **Practical Wisdom**: Provide actionable guidance for meaningful connection

Mission Characteristics:
- Emphasize quality time and shared experiences
- Include conversation starters or connection deepeners
- Respect different personality types and social energy levels
- Offer flexibility for different relationship dynamics
- Focus on creating positive memories together`,
  
  contextTemplate: `{CONTEXT_SECTION}`,
  
  instructionTemplate: `Create a relationship-building mission that:

**Focus Person/People:** {TARGET_RELATIONSHIPS}
**Mission Duration:** {ESTIMATED_DURATION} minutes
**Relationship Goal:** {RELATIONSHIP_GOAL}
**Interaction Style:** {INTERACTION_STYLE}

**Output Format:**

**Title:** [Warm, inviting title that makes the mission feel approachable and meaningful]

**Description:** [2-3 paragraphs that:
- Acknowledge the importance of this relationship
- Set up the activity in an encouraging way
- Explain how this will strengthen your connection]

**Your Mission:**
[Numbered steps that:
- Begin with preparation or mindset setting
- Guide through the main activity
- Include natural conversation prompts
- End with a meaningful closure or follow-up]

**Conversation Starters:**
[3-4 thoughtful questions or topics that can naturally arise during the activity]

**What You'll Need:**
[Simple list of any materials or preparation required]

**Connection Insight:**
[A brief insight about why this type of activity strengthens relationships]

**Follow-Up Idea:**
[One simple way to continue building on this experience]`,
  
  exampleTemplate: `**Example Mission:**

**Title:** "Coffee & Curiosity with Mom"

**Description:** 
Your relationship with your mom is one of your most treasured connections, and she's someone who's always been interested in learning new things. This mission creates a special opportunity to share something you're passionate about while learning something new about her world too.

You'll be having an intentional coffee date where you both take turns teaching each other something small but meaningful. It's a beautiful way to see each other as lifelong learners and discover new dimensions of your relationship.

**Your Mission:**
1. Invite your mom for coffee (either make it at home or visit that cozy café you both like)
2. Come prepared to teach her something you've learned recently that excited you – could be a cooking technique, a book insight, or even a new app
3. Ask her to share something she's discovered or learned lately that she finds interesting
4. Spend time really listening and asking follow-up questions about her interest
5. End by appreciating something specific you learned about her today

**Conversation Starters:**
- "What's something you've been curious about lately?"
- "What's a skill you'd love to learn if you had unlimited time?"
- "What's something about your generation that you think mine doesn't fully understand?"
- "What's a lesson you learned recently that surprised you?"

**What You'll Need:**
- Coffee or tea for both of you
- A comfortable, quiet space for conversation
- An open, curious mindset

**Connection Insight:**
When we position ourselves as both teacher and student with people we love, it creates equality and mutual respect that deepens intimacy.

**Follow-Up Idea:**
Send her an article or resource related to what she shared, showing you were truly listening and value her interests.`,
  
  outputFormat: 'structured_mission',
  
  createdAt: new Date('2024-12-01'),
  performanceMetrics: {
    averageRating: 4.8,
    completionRate: 0.88,
    relevanceScore: 4.9,
    generationLatency: 2.1,
    costEfficiency: 0.87,
    userSatisfaction: 4.7
  },
  
  validationRules: [
    { field: 'title', rule: 'includes_relationship_context', params: true },
    { field: 'conversation_starters', rule: 'count_between', params: [3, 5] },
    { field: 'personalization', rule: 'includes_specific_person', params: true },
    { field: 'tone', rule: 'warmth_score_above', params: [0.8] }
  ]
};
```

## Data Flow Architecture

### Real-Time Processing Pipeline

```typescript
interface DataFlowPipeline {
  ingestion: IngestionLayer;
  processing: ProcessingLayer;
  storage: StorageLayer;
  retrieval: RetrievalLayer;
  delivery: DeliveryLayer;
}

class DataFlowManager {
  private eventStream: EventStream;
  private contextEngine: ContextEngine;
  private missionEngine: MissionEngine;
  private learningEngine: LearningEngine;
  
  async processUserEvent(event: UserEvent): Promise<void> {
    // 1. Event Ingestion & Validation
    const validatedEvent = await this.validateEvent(event);
    
    // 2. Context Impact Analysis
    const contextImpact = await this.analyzeContextImpact(validatedEvent);
    
    // 3. Real-time Context Update
    if (contextImpact.requiresUpdate) {
      await this.contextEngine.updateContext(event.userId, contextImpact.updates);
    }
    
    // 4. Mission Trigger Evaluation
    const missionTriggers = await this.evaluateMissionTriggers(validatedEvent, contextImpact);
    
    // 5. Async Mission Generation (if triggered)
    if (missionTriggers.length > 0) {
      this.generateMissionsAsync(event.userId, missionTriggers);
    }
    
    // 6. Learning Pattern Update
    await this.learningEngine.processEvent(validatedEvent);
    
    // 7. Analytics Event Storage
    await this.storeAnalyticsEvent(validatedEvent);
  }
  
  private async analyzeContextImpact(event: UserEvent): Promise<ContextImpact> {
    const impact: ContextImpact = {
      requiresUpdate: false,
      updates: {},
      confidence: 0,
      impactAreas: []
    };
    
    switch (event.eventType) {
      case 'onboarding_complete':
        impact.requiresUpdate = true;
        impact.updates = {
          onboardingCompleted: true,
          completionTimestamp: event.timestamp,
          profileCompleteness: await this.calculateProfileCompleteness(event.userId)
        };
        impact.impactAreas = ['profile', 'mission_generation'];
        break;
        
      case 'mission_feedback':
        const feedback = event.eventData as MissionFeedback;
        impact.requiresUpdate = true;
        impact.updates = await this.analyzeFeedbackImpact(feedback);
        impact.impactAreas = ['preferences', 'difficulty_calibration', 'mission_types'];
        break;
        
      case 'preference_update':
        impact.requiresUpdate = true;
        impact.updates = event.eventData;
        impact.impactAreas = ['tastes', 'mission_generation'];
        break;
        
      case 'mission_completion':
        impact.requiresUpdate = true;
        impact.updates = await this.analyzeCompletionPatterns(event.userId, event.eventData);
        impact.impactAreas = ['behavior_patterns', 'success_prediction'];
        break;
    }
    
    return impact;
  }
  
  private async generateMissionsAsync(
    userId: string,
    triggers: MissionTrigger[]
  ): Promise<void> {
    // Queue mission generation tasks
    for (const trigger of triggers) {
      const task: MissionGenerationTask = {
        userId,
        trigger,
        priority: this.calculatePriority(trigger),
        scheduledFor: this.calculateOptimalGenerationTime(userId, trigger)
      };
      
      await this.queueMissionGeneration(task);
    }
  }
}
```

### Context-Aware Data Retrieval

```typescript
class ContextualDataRetrieval {
  async getContextForMissionGeneration(
    userId: string,
    missionType: MissionType,
    complexity: MissionComplexity
  ): Promise<GenerationContext> {
    // 1. Core user profile
    const userProfile = await this.getUserProfile(userId);
    
    // 2. Relevant relationships
    const relevantPeople = await this.getRelevantPeople(userId, missionType);
    
    // 3. Applicable taste preferences
    const relevantTastes = await this.getRelevantTastes(userId, missionType);
    
    // 4. Behavioral patterns
    const behaviorPatterns = await this.getBehaviorPatterns(userId);
    
    // 5. Recent mission history
    const missionHistory = await this.getRecentMissionHistory(userId, 30); // Last 30 days
    
    // 6. Current context factors
    const currentContext = await this.getCurrentContext(userId);
    
    // 7. Learning insights
    const learningInsights = await this.getLearningInsights(userId);
    
    return this.synthesizeGenerationContext({
      userProfile,
      relevantPeople,
      relevantTastes,
      behaviorPatterns,
      missionHistory,
      currentContext,
      learningInsights,
      missionType,
      complexity
    });
  }
  
  private async getRelevantPeople(
    userId: string,
    missionType: MissionType
  ): Promise<PersonProfile[]> {
    const query = this.buildPersonRelevanceQuery(missionType);
    
    return await this.db.query(`
      SELECT p.*, pi.interests, id.important_dates
      FROM people p
      LEFT JOIN person_interests pi ON p.id = pi.person_id
      LEFT JOIN important_dates id ON p.id = id.person_id
      WHERE p.user_id = $1 
        AND p.deleted_at IS NULL
        ${query.conditions}
      ORDER BY ${query.orderBy}
      LIMIT ${query.limit}
    `, [userId]);
  }
  
  private async getRelevantTastes(
    userId: string,
    missionType: MissionType
  ): Promise<TasteProfile> {
    const tasteQueries = this.buildTasteRelevanceQueries(missionType);
    
    const [musicTastes, foodTastes, movieTastes] = await Promise.all([
      tasteQueries.music ? this.getMusicTastes(userId) : null,
      tasteQueries.food ? this.getFoodTastes(userId) : null,
      tasteQueries.movies ? this.getMovieTastes(userId) : null
    ]);
    
    return {
      music: musicTastes,
      food: foodTastes,
      movies: movieTastes
    };
  }
  
  private async getBehaviorPatterns(userId: string): Promise<BehaviorPattern[]> {
    return await this.db.query(`
      SELECT pattern_type, pattern_data, confidence_score
      FROM behavioral_patterns
      WHERE user_id = $1 
        AND validation_status = 'validated'
        AND confidence_score > 0.7
      ORDER BY confidence_score DESC, updated_at DESC
    `, [userId]);
  }
}
```

### Embedding Generation & Similarity Search

```typescript
class EmbeddingManager {
  private openai: OpenAI;
  private pinecone: Pinecone;
  
  async generateUserProfileEmbedding(profile: UserContextProfile): Promise<number[]> {
    // Create a comprehensive text representation of the user profile
    const profileText = this.profileToText(profile);
    
    // Generate embedding using OpenAI's text-embedding-3-small
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: profileText,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  }
  
  async generateMissionEmbedding(mission: Mission): Promise<number[]> {
    const missionText = `${mission.title} ${mission.description} ${mission.missionType} ${mission.missionCategory}`;
    
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: missionText,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  }
  
  async findSimilarUsers(
    userId: string,
    similarityThreshold: number = 0.8
  ): Promise<SimilarUser[]> {
    // Get the user's profile embedding
    const userEmbedding = await this.getUserEmbedding(userId);
    
    // Search for similar users using vector similarity
    const searchResults = await this.pinecone.query({
      vector: userEmbedding,
      topK: 50,
      filter: {
        entity_type: 'user_profile',
        user_id: { $ne: userId } // Exclude the user themselves
      },
      includeMetadata: true
    });
    
    return searchResults.matches
      .filter(match => match.score >= similarityThreshold)
      .map(match => ({
        userId: match.metadata.user_id as string,
        similarity: match.score,
        sharedInterests: this.extractSharedInterests(match.metadata)
      }));
  }
  
  async findSimilarMissions(
    mission: Mission,
    limit: number = 10
  ): Promise<SimilarMission[]> {
    const missionEmbedding = await this.generateMissionEmbedding(mission);
    
    const searchResults = await this.pinecone.query({
      vector: missionEmbedding,
      topK: limit,
      filter: {
        entity_type: 'mission',
        mission_id: { $ne: mission.id }
      },
      includeMetadata: true
    });
    
    return searchResults.matches.map(match => ({
      missionId: match.metadata.mission_id as string,
      similarity: match.score,
      title: match.metadata.title as string,
      type: match.metadata.mission_type as string,
      avgRating: match.metadata.avg_rating as number
    }));
  }
  
  private profileToText(profile: UserContextProfile): string {
    const sections = [];
    
    // Life themes
    sections.push(`Life themes: ${profile.lifeThemes.primaryThemes.join(', ')}`);
    if (profile.lifeThemes.coupleMode) sections.push('In couple mode');
    if (profile.lifeThemes.familyMode) sections.push('In family mode');
    sections.push(`Time commitment: ${profile.lifeThemes.timeCommitment}`);
    
    // Relationships
    const relationships = profile.relationships.importantPeople.map(person => 
      `${person.relationship}: interested in ${person.interests.join(', ')}`
    ).join('. ');
    if (relationships) sections.push(`Important relationships: ${relationships}`);
    
    // Tastes
    if (profile.tastes.music?.genres) {
      sections.push(`Music preferences: ${profile.tastes.music.genres.join(', ')}`);
    }
    if (profile.tastes.food?.cuisines) {
      sections.push(`Food preferences: ${profile.tastes.food.cuisines.join(', ')}`);
    }
    if (profile.tastes.movies?.genres) {
      sections.push(`Movie preferences: ${profile.tastes.movies.genres.join(', ')}`);
    }
    
    // Behavioral patterns
    sections.push(`Preferred times: ${profile.behavior.preferredTimes.join(', ')}`);
    sections.push(`Spontaneity level: ${profile.behavior.spontaneityLevel}/10`);
    sections.push(`Planning style: ${profile.behavior.planningHorizon}`);
    
    return sections.join('. ');
  }
}
```

## Performance & Optimization

### Caching Strategies

```typescript
interface CacheConfig {
  userProfiles: {
    ttl: number; // 24 hours
    strategy: 'write-through';
    invalidation: 'event-driven';
  };
  
  missionTemplates: {
    ttl: number; // 7 days
    strategy: 'cache-aside';
    invalidation: 'version-based';
  };
  
  embeddings: {
    ttl: number; // 30 days
    strategy: 'lazy-loading';
    invalidation: 'manual';
  };
  
  llmResponses: {
    ttl: number; // 1 hour
    strategy: 'write-around';
    invalidation: 'immediate';
  };
}

class CacheManager {
  private redis: Redis;
  
  async getCachedUserContext(userId: string): Promise<UserContextProfile | null> {
    const cached = await this.redis.get(`user_context:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }
  
  async setCachedUserContext(userId: string, context: UserContextProfile): Promise<void> {
    await this.redis.setex(
      `user_context:${userId}`,
      24 * 60 * 60, // 24 hours
      JSON.stringify(context)
    );
  }
  
  async invalidateUserContext(userId: string): Promise<void> {
    await this.redis.del(`user_context:${userId}`);
    
    // Also invalidate related caches
    await this.redis.del(`user_embeddings:${userId}`);
    await this.redis.del(`behavioral_patterns:${userId}`);
  }
  
  async getCachedLLMResponse(promptHash: string): Promise<string | null> {
    return await this.redis.get(`llm_response:${promptHash}`);
  }
  
  async setCachedLLMResponse(promptHash: string, response: string): Promise<void> {
    await this.redis.setex(
      `llm_response:${promptHash}`,
      60 * 60, // 1 hour
      response
    );
  }
}
```

### Rate Limiting & Cost Management

```typescript
class CostManager {
  private rateLimiter: RateLimiter;
  private costTracker: CostTracker;
  
  async checkGenerationLimits(userId: string, provider: LLMProvider): Promise<boolean> {
    const userTier = await this.getUserTier(userId);
    const currentUsage = await this.getCurrentUsage(userId, provider.name);
    
    const limits = this.getTierLimits(userTier);
    
    // Check rate limits
    if (currentUsage.requestsPerHour >= limits.requestsPerHour) {
      throw new RateLimitError('Hourly request limit exceeded');
    }
    
    if (currentUsage.requestsPerDay >= limits.requestsPerDay) {
      throw new RateLimitError('Daily request limit exceeded');
    }
    
    // Check cost limits
    if (currentUsage.costPerDay >= limits.maxCostPerDay) {
      throw new CostLimitError('Daily cost limit exceeded');
    }
    
    return true;
  }
  
  async estimateGenerationCost(
    prompt: string,
    provider: LLMProvider
  ): Promise<number> {
    const tokenCount = this.estimateTokenCount(prompt);
    const inputCost = tokenCount * provider.inputCostPerToken;
    const estimatedOutputTokens = Math.min(tokenCount * 0.3, 1000); // Estimate output length
    const outputCost = estimatedOutputTokens * provider.outputCostPerToken;
    
    return inputCost + outputCost;
  }
  
  async trackGenerationCost(
    userId: string,
    provider: LLMProvider,
    actualCost: number
  ): Promise<void> {
    await this.costTracker.recordCost({
      userId,
      provider: provider.name,
      cost: actualCost,
      timestamp: new Date()
    });
    
    // Update user usage stats
    await this.updateUsageStats(userId, provider.name, actualCost);
  }
}
```

### Batch Processing & Optimization

```typescript
class BatchProcessor {
  async processDailyBatch(): Promise<void> {
    const startTime = new Date();
    
    // 1. User context analysis
    await this.batchUserContextAnalysis();
    
    // 2. Mission performance analysis
    await this.batchMissionPerformanceAnalysis();
    
    // 3. Behavioral pattern detection
    await this.batchBehavioralPatternDetection();
    
    // 4. Embedding updates
    await this.batchEmbeddingUpdates();
    
    // 5. Model performance evaluation
    await this.batchModelPerformanceEvaluation();
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    await this.logBatchCompletion('daily', duration);
  }
  
  private async batchUserContextAnalysis(): Promise<void> {
    const users = await this.getActiveUsers(24); // Users active in last 24 hours
    
    for (const userId of users) {
      try {
        // Recalculate engagement scores
        const engagementScore = await this.calculateEngagementScore(userId);
        
        // Update behavioral patterns
        const patterns = await this.detectBehavioralPatterns(userId);
        
        // Update profile completeness
        const completeness = await this.calculateProfileCompleteness(userId);
        
        await this.updateUserAnalytics(userId, {
          engagementScore,
          patterns,
          completeness
        });
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }
  }
  
  private async batchMissionPerformanceAnalysis(): Promise<void> {
    // Analyze missions completed in the last 24 hours
    const completedMissions = await this.getRecentlyCompletedMissions(24);
    
    for (const mission of completedMissions) {
      const performance = await this.analyzeMissionPerformance(mission);
      await this.updateMissionMetrics(mission.id, performance);
    }
    
    // Update template performance scores
    await this.updateTemplatePerformanceScores();
  }
  
  private async batchBehavioralPatternDetection(): Promise<void> {
    const users = await this.getUsersForPatternAnalysis();
    
    const patternDetectionPromises = users.map(async (userId) => {
      const events = await this.getUserEvents(userId, 30); // Last 30 days
      const patterns = await this.detectPatterns(events);
      
      for (const pattern of patterns) {
        await this.storeBehavioralPattern(userId, pattern);
      }
    });
    
    await Promise.all(patternDetectionPromises);
  }
}
```

This comprehensive LLM integration and data flow architecture provides Momento with a robust, scalable foundation for generating highly personalized, contextually relevant missions while maintaining performance, cost-efficiency, and user privacy.
