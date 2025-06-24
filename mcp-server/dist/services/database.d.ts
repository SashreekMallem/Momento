export interface UserProfile {
    id: string;
    user_id: string;
    display_name?: string;
    date_of_birth?: string;
    timezone?: string;
    location?: any;
    onboarding_completed: boolean;
    life_themes?: any;
    notification_preferences?: any;
    privacy_preferences?: any;
    app_preferences?: any;
    engagement_score: number;
    personalization_score: number;
    created_at: string;
    updated_at: string;
}
export interface Mission {
    id: string;
    user_id: string;
    title: string;
    description: string;
    mission_type: string;
    mission_category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_duration?: number;
    required_resources: string[];
    scheduling_flexibility: string;
    learning_objectives: string[];
    skills_reinforced: string[];
    status: string;
    activated_at?: string;
    personalized_elements?: any;
    generation_model?: string;
    prompt_version?: string;
    context_snapshot?: any;
    generation_cost?: number;
    engagement_score?: number;
    completion_likelihood?: number;
    created_at: string;
    updated_at: string;
}
export interface UserEvent {
    id: string;
    user_id: string;
    event_type: string;
    event_category: string;
    event_data?: any;
    session_id?: string;
    device_info?: any;
    app_version?: string;
    user_journey_stage?: string;
    created_at: string;
}
export declare class DatabaseService {
    private supabase;
    constructor();
    getUserProfile(userId: string): Promise<UserProfile | null>;
    updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean>;
    getUserPeople(userId: string): Promise<any[]>;
    getUserTastes(userId: string): Promise<{
        music: any;
        food: any;
        movie: any;
    }>;
    createMission(missionData: Omit<Mission, 'id' | 'created_at' | 'updated_at'>): Promise<Mission | null>;
    getUserMissions(userId: string, limit?: number): Promise<any[]>;
    updateMissionStatus(missionId: string, status: string, updates?: Partial<Mission>): Promise<boolean>;
    logEvent(userId: string, eventType: string, eventCategory: string, eventData?: any, sessionId?: string): Promise<boolean>;
    getUserEvents(userId: string, timeRange?: 'week' | 'month' | 'year', eventType?: string): Promise<any[]>;
    getBehavioralPatterns(userId: string): Promise<any[]>;
    updateBehavioralPattern(userId: string, patternType: string, patternData: any, confidenceScore: number): Promise<boolean>;
    getMissionFeedback(missionId: string): Promise<any[]>;
    getUserMissionStats(userId: string): Promise<{
        total: number;
        completed: number;
        completionRate: number;
        avgEngagement: number;
        avgCompletionLikelihood: number;
        difficultyStats: Record<string, number>;
        typeStats: Record<string, number>;
    } | null>;
    deleteMission(missionId: string): Promise<boolean>;
}
//# sourceMappingURL=database.d.ts.map