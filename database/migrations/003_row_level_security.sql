-- =====================================================
-- Momento Database Row Level Security (RLS)
-- Version: 1.0.0
-- Date: June 2025
-- Description: Security policies for all tables
-- =====================================================

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Core user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Relationship tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

-- Taste tables
ALTER TABLE music_tastes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_tastes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_tastes ENABLE ROW LEVEL SECURITY;

-- Mission tables
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_schedule ENABLE ROW LEVEL SECURITY;

-- Analytics tables (selective RLS)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_patterns ENABLE ROW LEVEL SECURITY;

-- Embeddings table does not need RLS as it's internal system data

-- =====================================================
-- USER POLICIES
-- =====================================================

-- Users can view their own record
CREATE POLICY "Users can view own record" ON users 
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users 
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON user_profiles 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- USER SESSIONS POLICIES
-- =====================================================

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PEOPLE POLICIES
-- =====================================================

-- Users can manage their own people
CREATE POLICY "Users can manage own people" ON people 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PERSON INTERESTS POLICIES
-- =====================================================

-- Users can manage interests for their own people
CREATE POLICY "Users can manage interests for own people" ON person_interests 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM people 
            WHERE people.id = person_interests.person_id 
            AND people.user_id = auth.uid()
        )
    );

-- =====================================================
-- IMPORTANT DATES POLICIES
-- =====================================================

-- Users can manage dates for their own people
CREATE POLICY "Users can manage dates for own people" ON important_dates 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM people 
            WHERE people.id = important_dates.person_id 
            AND people.user_id = auth.uid()
        )
    );

-- =====================================================
-- TASTE POLICIES
-- =====================================================

-- Users can manage their own music tastes
CREATE POLICY "Users can manage own music tastes" ON music_tastes 
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own food tastes
CREATE POLICY "Users can manage own food tastes" ON food_tastes 
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own movie tastes
CREATE POLICY "Users can manage own movie tastes" ON movie_tastes 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- MISSION POLICIES
-- =====================================================

-- Users can manage their own missions
CREATE POLICY "Users can manage own missions" ON missions 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- MISSION FEEDBACK POLICIES
-- =====================================================

-- Users can manage their own feedback
CREATE POLICY "Users can manage own feedback" ON mission_feedback 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- MISSION SCHEDULE POLICIES
-- =====================================================

-- Users can manage their own mission schedule
CREATE POLICY "Users can manage own mission schedule" ON mission_schedule 
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- ANALYTICS POLICIES
-- =====================================================

-- Users can view their own events (read-only for users)
CREATE POLICY "Users can view own events" ON user_events 
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert events (no user policy for INSERT/UPDATE/DELETE)

-- Users can view their own behavioral patterns
CREATE POLICY "Users can view own patterns" ON behavioral_patterns 
    FOR SELECT USING (auth.uid() = user_id);

-- System manages behavioral patterns (no user policy for INSERT/UPDATE/DELETE)

-- =====================================================
-- SERVICE ROLE POLICIES
-- =====================================================

-- Allow service role to bypass RLS on all tables for system operations
-- This will be handled at the application level with service role authentication

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions for service role operations
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
