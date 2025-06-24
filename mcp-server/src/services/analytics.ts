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

export class AnalyticsService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async analyzeUserBehavior(
    userId: string,
    timeRange: 'week' | 'month' | 'year' = 'month'
  ): Promise<UserAnalytics> {
    const [events, missions, profile, behavioralPatterns] = await Promise.all([
      this.databaseService.getUserEvents(userId, timeRange),
      this.databaseService.getUserMissions(userId, 50),
      this.databaseService.getUserProfile(userId),
      this.databaseService.getBehavioralPatterns(userId),
    ]);

    const engagement = this.analyzeEngagement(events, missions, timeRange);
    const behavioral = this.analyzeBehavioralPatterns(behavioralPatterns, missions);
    const personalization = this.analyzePersonalization(profile, behavioralPatterns);
    const insights = this.generateInsights(engagement, behavioral, personalization);

    return {
      userId,
      timeRange,
      engagement,
      behavioral,
      personalization,
      insights,
    };
  }

  private analyzeEngagement(events: any[], missions: any[], timeRange: string) {
    const sessionEvents = events.filter(e => e.event_type === 'session_start');
    const completedMissions = missions.filter(m => m.status === 'completed');
    
    const totalSessions = sessionEvents.length;
    const totalTimeSpent = events
      .filter(e => e.event_type === 'session_duration')
      .reduce((sum, e) => sum + (e.event_data?.duration || 0), 0);

    const averageSessionDuration = totalSessions > 0 ? totalTimeSpent / totalSessions : 0;
    const missionCompletionRate = missions.length > 0 ? completedMissions.length / missions.length : 0;

    // Analyze favorite features
    const featureUsage = events
      .filter(e => e.event_category === 'feature_usage')
      .reduce((acc, e) => {
        const feature = e.event_data?.feature;
        if (feature) {
          acc[feature] = (acc[feature] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    const favoriteFeatures = Object.entries(featureUsage)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([feature]) => feature);

    return {
      totalSessions,
      totalTimeSpent,
      averageSessionDuration,
      missionCompletionRate,
      favoriteFeatures,
    };
  }

  private analyzeBehavioralPatterns(patterns: any[], missions: any[]) {
    const peakActivityPattern = patterns.find(p => p.pattern_type === 'peak_activity_time');
    const peakActivityTimes = peakActivityPattern?.pattern_data?.peak_hours || [];

    // Analyze preferred mission types
    const missionTypeFrequency = missions.reduce((acc, m) => {
      acc[m.mission_type] = (acc[m.mission_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredMissionTypes = Object.entries(missionTypeFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => type);

    // Calculate consistency score
    const consistencyPattern = patterns.find(p => p.pattern_type === 'consistency');
    const consistencyScore = consistencyPattern?.confidence_score || 0.5;

    // Determine growth trajectory
    const recentMissions = missions.slice(0, 10);
    const olderMissions = missions.slice(-10);
    
    const recentEngagement = recentMissions.reduce((sum, m) => sum + (m.engagement_score || 0), 0) / recentMissions.length;
    const olderEngagement = olderMissions.reduce((sum, m) => sum + (m.engagement_score || 0), 0) / olderMissions.length;
    
    let growthTrajectory: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentEngagement > olderEngagement + 0.1) {
      growthTrajectory = 'improving';
    } else if (recentEngagement < olderEngagement - 0.1) {
      growthTrajectory = 'declining';
    }

    return {
      peakActivityTimes,
      preferredMissionTypes,
      consistencyScore,
      growthTrajectory,
    };
  }

  private analyzePersonalization(profile: any, patterns: any[]) {
    const profileCompleteness = this.calculateProfileCompleteness(profile);
    const personalizationScore = profile?.personalization_score || 0;

    // Track adaptation history from behavioral patterns
    const adaptationHistory = patterns
      .filter(p => p.pattern_type === 'adaptation_response')
      .map(p => ({
        timestamp: p.updated_at,
        adaptation: p.pattern_data?.adaptation_type,
        success: p.confidence_score > 0.7,
      }));

    return {
      profileCompleteness,
      personalizationScore,
      adaptationHistory,
    };
  }

  private calculateProfileCompleteness(profile: any): number {
    if (!profile) return 0;

    let completeness = 0;
    const totalFields = 10;

    if (profile.display_name) completeness += 0.1;
    if (profile.date_of_birth) completeness += 0.1;
    if (profile.timezone) completeness += 0.1;
    if (profile.location) completeness += 0.1;
    if (profile.life_themes) completeness += 0.2;
    if (profile.notification_preferences) completeness += 0.1;
    if (profile.privacy_preferences) completeness += 0.1;
    if (profile.app_preferences) completeness += 0.1;
    if (profile.onboarding_completed) completeness += 0.1;

    return Math.min(completeness, 1.0);
  }

  private generateInsights(engagement: any, behavioral: any, personalization: any) {
    const strengths: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths
    if (engagement.missionCompletionRate > 0.8) {
      strengths.push('High mission completion rate');
    }
    if (behavioral.consistencyScore > 0.7) {
      strengths.push('Consistent usage patterns');
    }
    if (personalization.personalizationScore > 0.8) {
      strengths.push('Well-developed personalization profile');
    }

    // Identify opportunities
    if (engagement.averageSessionDuration < 300) { // Less than 5 minutes
      opportunities.push('Increase session engagement');
      recommendations.push('Introduce shorter, more engaging mission formats');
    }
    if (behavioral.consistencyScore < 0.5) {
      opportunities.push('Improve usage consistency');
      recommendations.push('Implement smart reminder system based on peak activity times');
    }
    if (personalization.profileCompleteness < 0.7) {
      opportunities.push('Complete user profile');
      recommendations.push('Encourage completing remaining profile sections');
    }

    // Growth trajectory recommendations
    if (behavioral.growthTrajectory === 'declining') {
      recommendations.push('Re-engage with fresh mission types and difficulty adjustments');
    } else if (behavioral.growthTrajectory === 'improving') {
      recommendations.push('Introduce more challenging content to maintain growth');
    }

    return {
      strengths,
      opportunities,
      recommendations,
    };
  }

  async generatePersonalizationReport(userId: string): Promise<any> {
    const analytics = await this.analyzeUserBehavior(userId, 'month');
    
    return {
      userId,
      reportDate: new Date().toISOString(),
      summary: {
        overallScore: this.calculateOverallScore(analytics),
        primaryStrengths: analytics.insights.strengths.slice(0, 3),
        topRecommendations: analytics.insights.recommendations.slice(0, 3),
      },
      detailed: analytics,
      actionItems: this.generateActionItems(analytics),
    };
  }

  private calculateOverallScore(analytics: UserAnalytics): number {
    const engagementScore = (
      analytics.engagement.missionCompletionRate * 0.3 +
      Math.min(analytics.engagement.averageSessionDuration / 600, 1) * 0.2 // Cap at 10 minutes
    );

    const behavioralScore = (
      analytics.behavioral.consistencyScore * 0.2 +
      (analytics.behavioral.growthTrajectory === 'improving' ? 0.1 : 
       analytics.behavioral.growthTrajectory === 'stable' ? 0.05 : 0)
    );

    const personalizationScore = (
      analytics.personalization.profileCompleteness * 0.1 +
      analytics.personalization.personalizationScore * 0.1
    );

    return Math.min(engagementScore + behavioralScore + personalizationScore, 1.0);
  }

  private generateActionItems(analytics: UserAnalytics): any[] {
    const actions: any[] = [];

    // Based on engagement
    if (analytics.engagement.missionCompletionRate < 0.6) {
      actions.push({
        type: 'mission_difficulty',
        priority: 'high',
        action: 'Adjust mission difficulty to match user capability',
        expectedImpact: 'Increase completion rate by 15-25%',
      });
    }

    // Based on behavioral patterns
    if (analytics.behavioral.consistencyScore < 0.5) {
      actions.push({
        type: 'engagement_timing',
        priority: 'medium',
        action: 'Send notifications during peak activity times',
        expectedImpact: 'Improve consistency by 20-30%',
      });
    }

    // Based on personalization
    if (analytics.personalization.profileCompleteness < 0.7) {
      actions.push({
        type: 'profile_completion',
        priority: 'low',
        action: 'Prompt user to complete missing profile sections',
        expectedImpact: 'Enhance personalization accuracy by 10-15%',
      });
    }

    return actions;
  }
}
