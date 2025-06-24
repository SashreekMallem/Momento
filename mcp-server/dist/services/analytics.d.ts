import { DatabaseService } from './database.js';
export interface UserAnalytics {
    userId: string;
    timeRange: string;
    engagement: {
        totalSessions: number;
        totalTimeSpent: number;
        averageSessionDuration: number;
        missionCompletionRate: number;
        favoriteFeatures: string[];
    };
    behavioral: {
        peakActivityTimes: string[];
        preferredMissionTypes: string[];
        consistencyScore: number;
        growthTrajectory: 'improving' | 'stable' | 'declining';
    };
    personalization: {
        profileCompleteness: number;
        personalizationScore: number;
        adaptationHistory: any[];
    };
    insights: {
        strengths: string[];
        opportunities: string[];
        recommendations: string[];
    };
}
export declare class AnalyticsService {
    private databaseService;
    constructor(databaseService: DatabaseService);
    analyzeUserBehavior(userId: string, timeRange?: 'week' | 'month' | 'year'): Promise<UserAnalytics>;
    private analyzeEngagement;
    private analyzeBehavioralPatterns;
    private analyzePersonalization;
    private calculateProfileCompleteness;
    private generateInsights;
    generatePersonalizationReport(userId: string): Promise<any>;
    private calculateOverallScore;
    private generateActionItems;
}
//# sourceMappingURL=analytics.d.ts.map