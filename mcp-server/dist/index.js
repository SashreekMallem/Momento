#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { DatabaseService } from './services/database.js';
import { MissionGenerator } from './services/mission-generator.js';
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
class MomentoMCPServer {
    server;
    databaseService;
    missionGenerator;
    personalizationEngine;
    analyticsService;
    constructor() {
        this.server = new Server({
            name: 'momento-mcp-server',
            version: '1.0.0',
        });
        // Initialize services
        this.databaseService = new DatabaseService();
        this.missionGenerator = new MissionGenerator(this.databaseService);
        this.personalizationEngine = new PersonalizationEngine(this.databaseService);
        this.analyticsService = new AnalyticsService(this.databaseService);
        this.setupToolHandlers();
    }
    setupToolHandlers() {
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
                ],
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
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
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    async handleGenerateMission(args) {
        const { userId, preferences } = GenerateMissionSchema.parse(args);
        // Get user profile for personalization
        const userProfile = await this.databaseService.getUserProfile(userId);
        if (!userProfile) {
            throw new McpError(ErrorCode.InvalidRequest, 'User profile not found');
        }
        // Generate personalized mission
        const mission = await this.missionGenerator.generateMission(userId, preferences);
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
    async handleGetUserProfile(args) {
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
    async handleUpdateUserPreferences(args) {
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
    async handleAnalyzeUserBehavior(args) {
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
    async handleGetMissionRecommendations(args) {
        const { userId, count = 3 } = args;
        const recommendations = await this.missionGenerator.getRecommendations(userId, count);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        recommendations,
                    }, null, 2),
                },
            ],
        };
    }
    async handleGetPendingMissions(args) {
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
    async handleAcceptMission(args) {
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
    async handleRejectMission(args) {
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
//# sourceMappingURL=index.js.map