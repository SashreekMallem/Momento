#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';

import { DatabaseService } from './services/database.js';
// import { MissionGenerator } from './services/mission-generator.js';
import { EnhancedMissionGenerator } from './services/enhanced-mission-generator.js';
import { PersonalizationEngine } from './services/personalization.js';
import { AnalyticsService } from './services/analytics.js';

// Load environment variables
dotenv.config();

// Validation schemas
const GenerateMissionSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.object({
    missionType: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    duration: z.number().min(5).max(480).optional(), // 5 minutes to 8 hours
    context: z.string().optional(),
  }).optional(),
});

const GetUserProfileSchema = z.object({
  userId: z.string().uuid(),
});

const UpdateUserPreferencesSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.record(z.any()),
});

const AnalyzeUserBehaviorSchema = z.object({
  userId: z.string().uuid(),
  timeRange: z.enum(['week', 'month', 'year']).default('month'),
});

const GenerateLifeChapterSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
  chapterTitle: z.string().optional(),
  description: z.string().optional(),
});

class MomentoMCPServer {
  private server: Server;
  private databaseService: DatabaseService;
  // private missionGenerator: MissionGenerator;
  private enhancedMissionGenerator: EnhancedMissionGenerator;
  private personalizationEngine: PersonalizationEngine;
  private analyticsService: AnalyticsService;

  constructor() {
    this.server = new Server({
      name: 'momento-mcp-server',
      version: '1.0.0',
    });

    // Initialize services
    this.databaseService = new DatabaseService();
    // this.missionGenerator = new MissionGenerator(this.databaseService);
    this.enhancedMissionGenerator = new EnhancedMissionGenerator(this.databaseService);
    this.personalizationEngine = new PersonalizationEngine(this.databaseService);
    this.analyticsService = new AnalyticsService(this.databaseService);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_mission',
            description: 'Generate a personalized mission for a user based on their profile and preferences',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to generate a mission for',
                },
                preferences: {
                  type: 'object',
                  properties: {
                    missionType: {
                      type: 'string',
                      description: 'Type of mission (experience, connection, creativity, etc.)',
                    },
                    difficulty: {
                      type: 'string',
                      enum: ['beginner', 'intermediate', 'advanced'],
                      description: 'Mission difficulty level',
                    },
                    duration: {
                      type: 'number',
                      minimum: 5,
                      maximum: 480,
                      description: 'Desired mission duration in minutes',
                    },
                    context: {
                      type: 'string',
                      description: 'Additional context or specific requirements',
                    },
                  },
                  description: 'Mission generation preferences',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'get_user_profile',
            description: 'Retrieve comprehensive user profile including all preferences and history',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to retrieve profile for',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'update_user_preferences',
            description: 'Update user preferences based on interactions and feedback',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to update preferences for',
                },
                preferences: {
                  type: 'object',
                  description: 'New or updated preference data',
                },
              },
              required: ['userId', 'preferences'],
            },
          },
          {
            name: 'analyze_user_behavior',
            description: 'Analyze user behavior patterns and provide insights',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to analyze behavior for',
                },
                timeRange: {
                  type: 'string',
                  enum: ['week', 'month', 'year'],
                  default: 'month',
                  description: 'Time range for behavior analysis',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'get_mission_recommendations',
            description: 'Get AI-powered mission recommendations based on user profile',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to get recommendations for',
                },
                count: {
                  type: 'number',
                  minimum: 1,
                  maximum: 10,
                  default: 3,
                  description: 'Number of recommendations to generate',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'get_pending_missions',
            description: 'Get pending missions that need user approval',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to get pending missions for',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'accept_mission',
            description: 'Accept a pending mission and activate it',
            inputSchema: {
              type: 'object',
              properties: {
                missionId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The mission ID to accept',
                },
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID accepting the mission',
                },
              },
              required: ['missionId', 'userId'],
            },
          },
          {
            name: 'reject_mission',
            description: 'Reject and delete a pending mission',
            inputSchema: {
              type: 'object',
              properties: {
                missionId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The mission ID to reject',
                },
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID rejecting the mission',
                },
                reason: {
                  type: 'string',
                  description: 'Optional reason for rejection (for learning)',
                },
              },
              required: ['missionId', 'userId'],
            },
          },
          {
            name: 'generate_life_chapter',
            description: 'Generate a Life Chapter summary for a user based on missions, journals, and time capsules in a date range',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'The user ID to generate a Life Chapter for',
                },
                startDate: {
                  type: 'string',
                  description: 'Start date (inclusive, ISO string)',
                },
                endDate: {
                  type: 'string',
                  description: 'End date (inclusive, ISO string)',
                },
                chapterTitle: {
                  type: 'string',
                  description: 'Optional title for the Life Chapter',
                },
                description: {
                  type: 'string',
                  description: 'Optional description for the Life Chapter',
                },
              },
              required: ['userId', 'startDate', 'endDate'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'submit_mission_idea':
            return await this.handleSubmitMissionIdea(args);
          case 'generate_mission':
            return await this.handleGenerateMission(args);
          case 'get_user_profile':
            return await this.handleGetUserProfile(args);
          case 'update_user_preferences':
            return await this.handleUpdateUserPreferences(args);
          case 'analyze_user_behavior':
            return await this.handleAnalyzeUserBehavior(args);
          case 'get_mission_recommendations':
            return await this.handleGetMissionRecommendations(args);
          case 'get_pending_missions':
            return await this.handleGetPendingMissions(args);
          case 'accept_mission':
            return await this.handleAcceptMission(args);
          case 'reject_mission':
            return await this.handleRejectMission(args);
          case 'generate_life_chapter':
            return await this.handleGenerateLifeChapter(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }
  // Handler for user-submitted mission ideas
  private async handleSubmitMissionIdea(args: any) {
    const SubmitMissionIdeaSchema = z.object({
      title: z.string().min(3),
      description: z.string().min(5),
      mission_type: z.string(),
      mission_category: z.string(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      estimated_duration: z.number().optional(),
      required_resources: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      source_user_id: z.string().uuid().optional(),
    });
    const parsed = SubmitMissionIdeaSchema.parse(args);
    const idea = {
      ...parsed,
      source_type: parsed.source_user_id ? 'user_submitted' : 'manual',
      moderation_status: 'pending',
      is_active: true,
    };
    const result = await this.databaseService.addMissionIdea(idea);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: !!result, idea: result }, null, 2),
        },
      ],
    };
  }

  private async handleGenerateMission(args: any) {
    const { userId, preferences } = GenerateMissionSchema.parse(args);
    
    // Get user profile for personalization
    const userProfile = await this.databaseService.getUserProfile(userId);
    if (!userProfile) {
      throw new McpError(ErrorCode.InvalidRequest, 'User profile not found');
    }

    // Generate personalized mission (ENHANCED)
    const [mission] = await this.enhancedMissionGenerator.generateMission(userId, preferences);
    
    // Log generation event
    await this.databaseService.logEvent(userId, 'mission_generated', 'ai_generation', {
      missionId: mission.id,
      missionType: mission.mission_type,
      generationModel: mission.generation_model,
      preferences,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            mission: {
              id: mission.id,
              title: mission.title,
              description: mission.description,
              type: mission.mission_type,
              category: mission.mission_category,
              difficulty: mission.difficulty,
              estimatedDuration: mission.estimated_duration,
              personalizedElements: mission.personalized_elements,
              learningObjectives: mission.learning_objectives,
              requiredResources: mission.required_resources,
            },
            metadata: {
              generatedAt: mission.created_at,
              model: mission.generation_model,
              cost: mission.generation_cost,
              completionLikelihood: mission.completion_likelihood,
            },
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetUserProfile(args: any) {
    const { userId } = GetUserProfileSchema.parse(args);
    
    const profile = await this.personalizationEngine.getCompleteUserProfile(userId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            profile,
          }, null, 2),
        },
      ],
    };
  }

  private async handleUpdateUserPreferences(args: any) {
    const { userId, preferences } = UpdateUserPreferencesSchema.parse(args);
    
    const updated = await this.personalizationEngine.updateUserPreferences(userId, preferences);
    
    // Log preference update
    await this.databaseService.logEvent(userId, 'preferences_updated', 'personalization', {
      updatedFields: Object.keys(preferences),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            updated,
          }, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeUserBehavior(args: any) {
    const { userId, timeRange } = AnalyzeUserBehaviorSchema.parse(args);
    
    const analysis = await this.analyticsService.analyzeUserBehavior(userId, timeRange);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            analysis,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetMissionRecommendations(args: any) {
    const { userId, count = 3 } = args;
    
    // const recommendations = await this.missionGenerator.getRecommendations(userId, count);
    // TODO: If recommendations are needed, use enhancedMissionGenerator or implement equivalent logic.
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: 'Mission recommendations are not available. Please use enhanced mission generation.',
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetPendingMissions(args: any) {
    const { userId } = args;
    
    // Get missions with 'generated' status (pending approval)
    const pendingMissions = await this.databaseService.getUserMissions(userId, 10);
    const pending = pendingMissions.filter(mission => mission.status === 'generated');
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pendingMissions: pending.map(mission => ({
              id: mission.id,
              title: mission.title,
              description: mission.description,
              type: mission.mission_type,
              category: mission.mission_category,
              difficulty: mission.difficulty,
              estimatedDuration: mission.estimated_duration,
              personalizedElements: mission.personalized_elements,
              createdAt: mission.created_at,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleAcceptMission(args: any) {
    const { missionId, userId } = args;
    
    // Update mission status to 'active'
    const success = await this.databaseService.updateMissionStatus(missionId, 'active', {
      activated_at: new Date().toISOString(),
    });
    
    if (success) {
      // Log acceptance event
      await this.databaseService.logEvent(userId, 'mission_accepted', 'user_action', {
        missionId,
        timestamp: new Date().toISOString(),
      });
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success,
            message: success ? 'Mission accepted and activated' : 'Failed to accept mission',
          }, null, 2),
        },
      ],
    };
  }

  private async handleRejectMission(args: any) {
    const { missionId, userId, reason } = args;
    
    // Log rejection event for learning
    await this.databaseService.logEvent(userId, 'mission_rejected', 'user_action', {
      missionId,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString(),
    });
    
    // Delete the mission from database
    const success = await this.databaseService.deleteMission(missionId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success,
            message: success ? 'Mission rejected and deleted' : 'Failed to reject mission',
          }, null, 2),
        },
      ],
    };
  }

  private async handleGenerateLifeChapter(args: any) {
    const { userId, startDate, endDate, chapterTitle, description } = GenerateLifeChapterSchema.parse(args);
    // Insert the new life chapter into the database
    const inserted = await this.databaseService.createLifeChapter({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      title: chapterTitle || '',
      description: description || '',
    });
    // Fetch all relevant data for the user in the date range
    const [missions, journalEntries, timeCapsules] = await Promise.all([
      this.databaseService.getUserMissionsInRange(userId, startDate, endDate),
      this.databaseService.getUserJournalEntries(userId, startDate, endDate),
      this.databaseService.getUserTimeCapsules(userId, startDate, endDate),
    ]);
    // Compose the MCP payload
    const lifeChapter = {
      ...inserted,
      missions,
      journal_entries: journalEntries,
      time_capsules: timeCapsules,
    };
    // Generate summary, story, and photo captions using GPT
    let gptResult = null;
    try {
      gptResult = await this.enhancedMissionGenerator.generateLifeChapterStory(lifeChapter);
    } catch (e) {
      gptResult = { summary: '', story: 'AI generation failed', photos: [] };
    }
    return {
      content: [
        {
          type: 'json',
          text: JSON.stringify({ success: true, lifeChapter, gptResult }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Momento MCP Server running on stdio');
  }
}

// Start the server
const server = new MomentoMCPServer();
server.run().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
