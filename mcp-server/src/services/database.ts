import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood?: string | number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TimeCapsule {
  id: string;
  user_id: string;
  title: string;
  message: string;
  unlock_date: string;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface LifeChapter {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  title: string;
  description: string;
  cover_image_url?: string;
  gpt_summary?: string;
  gpt_story?: string;
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // User Profile Operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    return true;
  }

  // User Data Retrieval
  async getUserPeople(userId: string) {
    const { data, error } = await this.supabase
      .from('people')
      .select(`
        *,
        person_interests (*),
        important_dates (*)
      `)
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching user people:', error);
      return [];
    }

    return data || [];
  }

  async getUserTastes(userId: string) {
    const [musicTastes, foodTastes, movieTastes] = await Promise.all([
      this.supabase.from('music_tastes').select('*').eq('user_id', userId).single(),
      this.supabase.from('food_tastes').select('*').eq('user_id', userId).single(),
      this.supabase.from('movie_tastes').select('*').eq('user_id', userId).single(),
    ]);

    return {
      music: musicTastes.data,
      food: foodTastes.data,
      movie: movieTastes.data,
    };
  }

  // Mission Operations
  async createMission(missionData: Omit<Mission, 'id' | 'created_at' | 'updated_at'>): Promise<Mission | null> {
    const { data, error } = await this.supabase
      .from('missions')
      .insert([{
        ...missionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating mission:', error);
      return null;
    }

    return data;
  }

  async getUserMissions(userId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user missions:', error);
      return [];
    }

    return data || [];
  }

  async updateMissionStatus(missionId: string, status: string, updates?: Partial<Mission>): Promise<boolean> {
    const { error } = await this.supabase
      .from('missions')
      .update({
        status,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId);

    if (error) {
      console.error('Error updating mission status:', error);
      return false;
    }

    return true;
  }

  // Analytics Operations
  async logEvent(
    userId: string,
    eventType: string,
    eventCategory: string,
    eventData?: any,
    sessionId?: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_events')
      .insert([{
        user_id: userId,
        event_type: eventType,
        event_category: eventCategory,
        event_data: eventData,
        session_id: sessionId,
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Error logging event:', error);
      return false;
    }

    return true;
  }

  async getUserEvents(
    userId: string,
    timeRange: 'week' | 'month' | 'year' = 'month',
    eventType?: string
  ) {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = this.supabase
      .from('user_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user events:', error);
      return [];
    }

    return data || [];
  }

  // Behavioral Patterns
  async getBehavioralPatterns(userId: string) {
    const { data, error } = await this.supabase
      .from('behavioral_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('validation_status', 'validated')
      .order('confidence_score', { ascending: false });

    if (error) {
      console.error('Error fetching behavioral patterns:', error);
      return [];
    }

    return data || [];
  }

  async updateBehavioralPattern(
    userId: string,
    patternType: string,
    patternData: any,
    confidenceScore: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('behavioral_patterns')
      .upsert({
        user_id: userId,
        pattern_type: patternType,
        pattern_data: patternData,
        confidence_score: confidenceScore,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating behavioral pattern:', error);
      return false;
    }

    return true;
  }

  // Mission Feedback
  async getMissionFeedback(missionId: string) {
    const { data, error } = await this.supabase
      .from('mission_feedback')
      .select('*')
      .eq('mission_id', missionId);

    if (error) {
      console.error('Error fetching mission feedback:', error);
      return [];
    }

    return data || [];
  }

  async getUserMissionStats(userId: string) {
    const { data, error } = await this.supabase
      .from('missions')
      .select('status, difficulty, mission_type, completion_likelihood, engagement_score')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user mission stats:', error);
      return null;
    }

    // Calculate statistics
    const total = data.length;
    const completed = data.filter(m => m.status === 'completed').length;
    const avgEngagement = data.reduce((sum, m) => sum + (m.engagement_score || 0), 0) / total;
    const avgCompletionLikelihood = data.reduce((sum, m) => sum + (m.completion_likelihood || 0), 0) / total;
    
    const difficultyStats = data.reduce((acc, m) => {
      acc[m.difficulty] = (acc[m.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeStats = data.reduce((acc, m) => {
      acc[m.mission_type] = (acc[m.mission_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      completed,
      completionRate: total > 0 ? completed / total : 0,
      avgEngagement,
      avgCompletionLikelihood,
      difficultyStats,
      typeStats,
    };
  }

  async deleteMission(missionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (error) {
      console.error('Error deleting mission:', error);
      return false;
    }

    return true;
  }

  async getUserJournalEntries(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    const { data, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }
    return data || [];
  }

  async getUserTimeCapsules(userId: string, startDate: string, endDate: string): Promise<TimeCapsule[]> {
    const { data, error } = await this.supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching time capsules:', error);
      return [];
    }
    return data || [];
  }

  async getUserMissionsInRange(userId: string, startDate: string, endDate: string): Promise<Mission[]> {
    const { data, error } = await this.supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching missions in range:', error);
      return [];
    }
    return data || [];
  }

  async createLifeChapter(chapter: Omit<LifeChapter, 'id' | 'created_at' | 'updated_at'>): Promise<LifeChapter | null> {
    const { data, error } = await this.supabase
      .from('life_chapters')
      .insert([{ ...chapter, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      console.error('Error creating life chapter:', error);
      return null;
    }
    return data;
  }
}
