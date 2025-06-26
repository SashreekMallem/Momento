import { DatabaseService, Mission } from './database.js';
export interface MissionPreferences {
    missionType?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
    context?: string;
}
export interface MissionRecommendation {
    title: string;
    description: string;
    type: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
    confidence: number;
    reasoning: string;
}
export declare class MissionGenerator {
    private openai?;
    private anthropic?;
    private databaseService;
    constructor(databaseService: DatabaseService);
    generateMission(userId: string, preferences?: MissionPreferences): Promise<Mission>;
    private remixIdeasWithLLM;
    getRecommendations(userId: string, count?: number): Promise<MissionRecommendation[]>;
    private gatherUserContext;
    private generateMissionWithAI;
    private buildMissionGenerationPrompt;
    private getFocusedDataForMission;
    private getThemeSpecificContext;
    private determineMissionCategory;
    private generateWithOpenAI;
    private generateWithAnthropic;
    private generateFallbackMission;
    private generateRecommendationsWithAI;
    private buildAdvancedMusicProfile;
    private buildAdvancedFoodProfile;
    private buildAdvancedMovieProfile;
    private buildRelationshipInsights;
    private getPreferredDifficulty;
    private getTypicalEngagementTime;
    private getDiscoveryStyle;
    private calculateOpenAICost;
    private calculateAnthropicCost;
}
//# sourceMappingURL=mission-generator.d.ts.map