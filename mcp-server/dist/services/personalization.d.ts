import { DatabaseService } from './database.js';
export interface CompleteUserProfile {
    basic: any;
    relationships: any[];
    preferences: {
        music: any;
        food: any;
        movie: any;
    };
    behavioral: any[];
    performance: any;
    insights: {
        personalityTraits: string[];
        preferredActivities: string[];
        socialPreferences: string;
        timePreferences: string[];
        engagementPatterns: any;
    };
}
export declare class PersonalizationEngine {
    private databaseService;
    constructor(databaseService: DatabaseService);
    getCompleteUserProfile(userId: string): Promise<CompleteUserProfile>;
    updateUserPreferences(userId: string, preferences: any): Promise<boolean>;
    private generateUserInsights;
    private inferPersonalityTraits;
    private inferPreferredActivities;
    private inferSocialPreferences;
    private inferTimePreferences;
    private analyzeEngagementPatterns;
    private getPreferredDifficulty;
    private calculateConsistencyScore;
    private identifyMotivationFactors;
    private calculatePersonalizationScore;
    private updateBehavioralPatternsFromPreferences;
    adaptUserExperience(userId: string): Promise<any>;
    private getRecommendedMissionTypes;
    private getOptimalScheduling;
    private getPersonalizedUISettings;
    private getPreferredCommunicationStyle;
    private calculateOptimalFrequency;
}
//# sourceMappingURL=personalization.d.ts.map