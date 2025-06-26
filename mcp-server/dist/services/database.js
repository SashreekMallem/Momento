// ...existing code...
import { createClient } from '@supabase/supabase-js';
export class DatabaseService {
    supabase;
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
    // Get recent missions for a user (to avoid repeats)
    async getUserRecentMissionIdeas(userId, limit = 10) {
        const { data, error } = await this.supabase
            .from('missions')
            .select('original_mission_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            console.error('Error fetching recent mission ideas:', error);
            return [];
        }
        return (data || []).map((m) => m.original_mission_id).filter(Boolean);
    }
    // Search mission ideas by theme, social context, and exclude recent
    async searchMissionIdeas(params) {
        const { theme, socialContext, excludeIds = [], limit = 10 } = params;
        let query = this.supabase
            .from('mission_ideas')
            .select('*')
            .eq('is_active', true)
            .eq('moderation_status', 'approved')
            .ilike('tags', `%${theme}%`)
            .ilike('mission_category', `%${socialContext}%`)
            .order('usage_count', { ascending: false })
            .limit(limit);
        if (excludeIds.length > 0) {
            query = query.not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error searching mission ideas:', error);
            return [];
        }
        return data || [];
    }
    // Add a new mission idea to the bank
    async addMissionIdea(idea) {
        const { data, error } = await this.supabase
            .from('mission_ideas')
            .insert([{ ...idea, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) {
            console.error('Error adding mission idea:', error);
            return null;
        }
        return data;
    }
    // User Profile Operations
    async getUserProfile(userId) {
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
    async updateUserProfile(userId, updates) {
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
    async getUserPeople(userId) {
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
    async getUserTastes(userId) {
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
    async createMission(missionData) {
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
    async getUserMissions(userId, limit = 10) {
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
    async updateMissionStatus(missionId, status, updates) {
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
    async logEvent(userId, eventType, eventCategory, eventData, sessionId) {
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
    async getUserEvents(userId, timeRange = 'month', eventType) {
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
    async getBehavioralPatterns(userId) {
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
    async updateBehavioralPattern(userId, patternType, patternData, confidenceScore) {
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
    async getMissionFeedback(missionId) {
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
    async getUserMissionStats(userId) {
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
        }, {});
        const typeStats = data.reduce((acc, m) => {
            acc[m.mission_type] = (acc[m.mission_type] || 0) + 1;
            return acc;
        }, {});
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
    async deleteMission(missionId) {
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
    async getUserJournalEntries(userId, startDate, endDate) {
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
    async getUserTimeCapsules(userId, startDate, endDate) {
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
    async getUserMissionsInRange(userId, startDate, endDate) {
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
    async createLifeChapter(chapter) {
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
//# sourceMappingURL=database.js.map