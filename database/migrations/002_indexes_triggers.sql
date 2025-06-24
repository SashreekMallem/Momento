-- =====================================================
-- Momento Database Indexes and Triggers
-- Version: 1.0.0
-- Date: June 2025
-- Description: Performance indexes and automated triggers
-- =====================================================

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_users_email_status ON users(email, status);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed, onboarding_step);
CREATE INDEX idx_user_profiles_engagement ON user_profiles(engagement_score);
CREATE INDEX idx_user_profiles_onboarding_user ON user_profiles(onboarding_completed, user_id);
-- CREATE INDEX idx_user_profiles_location USING gin (location); -- Commented out - create after confirming JSONB support

-- People indexes
CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_relationship ON people(relationship);
CREATE INDEX idx_people_name ON people(name);
CREATE INDEX idx_people_birth_date ON people(date_of_birth);
-- CREATE INDEX idx_people_name_search ON people USING gin(to_tsvector('english', name)); -- Text search - enable after testing

-- Person interests indexes
CREATE INDEX idx_person_interests_person_id ON person_interests(person_id);
CREATE INDEX idx_person_interests_category ON person_interests(category);
CREATE INDEX idx_person_interests_relevance ON person_interests(relevance_score DESC);

-- Important dates indexes
CREATE INDEX idx_important_dates_person_id ON important_dates(person_id);
CREATE INDEX idx_important_dates_date ON important_dates(date_value);
CREATE INDEX idx_important_dates_type ON important_dates(date_type);
CREATE INDEX idx_important_dates_importance ON important_dates(importance_level DESC);

-- Music tastes indexes
CREATE INDEX idx_music_tastes_user_id ON music_tastes(user_id);
-- CREATE INDEX idx_music_tastes_genres USING gin (genres); -- Array index - enable after testing
-- CREATE INDEX idx_music_tastes_artists USING gin (favorite_artists); -- Array index - enable after testing  
-- CREATE INDEX idx_music_tastes_moods USING gin (music_moods); -- Array index - enable after testing

-- Food tastes indexes
CREATE INDEX idx_food_tastes_user_id ON food_tastes(user_id);
-- CREATE INDEX idx_food_tastes_cuisines USING gin (cuisines); -- Array index - enable after testing
-- CREATE INDEX idx_food_tastes_dietary USING gin (dietary_restrictions); -- Array index - enable after testing
-- CREATE INDEX idx_food_tastes_restaurants USING gin (favorite_restaurants); -- Array index - enable after testing

-- Movie tastes indexes
CREATE INDEX idx_movie_tastes_user_id ON movie_tastes(user_id);
-- CREATE INDEX idx_movie_tastes_genres USING gin (genres); -- Array index - enable after testing
-- CREATE INDEX idx_movie_tastes_directors USING gin (favorite_directors); -- Array index - enable after testing
-- CREATE INDEX idx_movie_tastes_actors USING gin (favorite_actors); -- Array index - enable after testing
-- CREATE INDEX idx_movie_tastes_moods USING gin (movie_moods); -- Array index - enable after testing

-- Missions indexes
CREATE INDEX idx_missions_user_id ON missions(user_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_type ON missions(mission_type);
CREATE INDEX idx_missions_category ON missions(mission_category);
CREATE INDEX idx_missions_scheduled_for ON missions(scheduled_for);
CREATE INDEX idx_missions_completed_at ON missions(completed_at);
CREATE INDEX idx_missions_created_at ON missions(created_at);
CREATE INDEX idx_missions_user_status_scheduled ON missions(user_id, status, scheduled_for);
CREATE INDEX idx_missions_type_difficulty ON missions(mission_type, difficulty);
CREATE INDEX idx_missions_completion_time ON missions(completed_at) WHERE completed_at IS NOT NULL;
-- CREATE INDEX idx_missions_personalized USING gin (personalized_elements); -- JSONB index - enable after testing
-- CREATE INDEX idx_missions_content_search ON missions USING gin(to_tsvector('english', title || ' ' || description)); -- Text search - enable after testing

-- Mission feedback indexes
CREATE INDEX idx_mission_feedback_mission_id ON mission_feedback(mission_id);
CREATE INDEX idx_mission_feedback_user_id ON mission_feedback(user_id);
CREATE INDEX idx_mission_feedback_overall_rating ON mission_feedback(overall_rating);
CREATE INDEX idx_mission_feedback_created_at ON mission_feedback(created_at);
CREATE INDEX idx_mission_feedback_completion_status ON mission_feedback(completion_status);
CREATE INDEX idx_mission_feedback_rating_date ON mission_feedback(overall_rating, created_at);

-- Mission schedule indexes
CREATE INDEX idx_mission_schedule_mission_id ON mission_schedule(mission_id);
CREATE INDEX idx_mission_schedule_user_id ON mission_schedule(user_id);
CREATE INDEX idx_mission_schedule_scheduled_for ON mission_schedule(scheduled_for);
CREATE INDEX idx_mission_schedule_status ON mission_schedule(status);
-- CREATE INDEX idx_mission_schedule_reminder_settings USING gin (reminder_settings); -- JSONB index - enable after testing

-- User events indexes
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_type ON user_events(event_type);
CREATE INDEX idx_user_events_category ON user_events(event_category);
CREATE INDEX idx_user_events_created_at ON user_events(created_at);
CREATE INDEX idx_user_events_session_id ON user_events(session_id);
CREATE INDEX idx_user_events_user_type_date ON user_events(user_id, event_type, created_at);
-- CREATE INDEX idx_user_events_data USING gin (event_data); -- JSONB index - enable after testing

-- Behavioral patterns indexes
CREATE INDEX idx_behavioral_patterns_user_id ON behavioral_patterns(user_id);
CREATE INDEX idx_behavioral_patterns_type ON behavioral_patterns(pattern_type);
CREATE INDEX idx_behavioral_patterns_confidence ON behavioral_patterns(confidence_score DESC);
CREATE INDEX idx_behavioral_patterns_updated_at ON behavioral_patterns(updated_at);
-- CREATE INDEX idx_behavioral_patterns_data USING gin (pattern_data); -- JSONB index - enable after testing

-- Embeddings indexes
CREATE INDEX idx_embeddings_entity ON embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_model ON embeddings(embedding_model);
CREATE INDEX idx_embeddings_hash ON embeddings(content_hash);
-- Vector similarity index (requires pgvector extension with proper configuration)
-- CREATE INDEX idx_embeddings_vector USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at 
    BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_important_dates_updated_at 
    BEFORE UPDATE ON important_dates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_tastes_updated_at 
    BEFORE UPDATE ON music_tastes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_tastes_updated_at 
    BEFORE UPDATE ON food_tastes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movie_tastes_updated_at 
    BEFORE UPDATE ON movie_tastes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at 
    BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_schedule_updated_at 
    BEFORE UPDATE ON mission_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behavioral_patterns_updated_at 
    BEFORE UPDATE ON behavioral_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embeddings_updated_at 
    BEFORE UPDATE ON embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PROFILE COMPLETION SCORING
-- =====================================================

-- Function to calculate profile completion score
CREATE OR REPLACE FUNCTION calculate_profile_completion_score(profile_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    score DECIMAL(3,2) := 0.0;
    profile_record user_profiles%ROWTYPE;
    people_count INTEGER;
    music_exists BOOLEAN;
    food_exists BOOLEAN;
    movies_exists BOOLEAN;
BEGIN
    -- Get the profile record
    SELECT * INTO profile_record FROM user_profiles WHERE id = profile_id;
    
    -- Basic profile information (30%)
    IF profile_record.display_name IS NOT NULL THEN score := score + 0.10; END IF;
    IF profile_record.date_of_birth IS NOT NULL THEN score := score + 0.05; END IF;
    IF profile_record.location IS NOT NULL THEN score := score + 0.05; END IF;
    IF profile_record.life_themes IS NOT NULL THEN score := score + 0.10; END IF;
    
    -- People information (25%)
    SELECT COUNT(*) INTO people_count FROM people WHERE user_id = profile_record.user_id AND deleted_at IS NULL;
    IF people_count >= 1 THEN score := score + 0.10; END IF;
    IF people_count >= 3 THEN score := score + 0.10; END IF;
    IF people_count >= 5 THEN score := score + 0.05; END IF;
    
    -- Taste profiles (45% total - 15% each)
    SELECT EXISTS(SELECT 1 FROM music_tastes WHERE user_id = profile_record.user_id) INTO music_exists;
    SELECT EXISTS(SELECT 1 FROM food_tastes WHERE user_id = profile_record.user_id) INTO food_exists;
    SELECT EXISTS(SELECT 1 FROM movie_tastes WHERE user_id = profile_record.user_id) INTO movies_exists;
    
    IF music_exists THEN score := score + 0.15; END IF;
    IF food_exists THEN score := score + 0.15; END IF;
    IF movies_exists THEN score := score + 0.15; END IF;
    
    RETURN LEAST(score, 1.0); -- Cap at 1.0
END;
$$ LANGUAGE plpgsql;

-- Trigger to update completion score when relevant data changes
CREATE OR REPLACE FUNCTION update_profile_completion_score()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    profile_id UUID;
BEGIN
    -- Determine the user_id based on the table being updated
    IF TG_TABLE_NAME = 'user_profiles' THEN
        target_user_id := COALESCE(NEW.user_id, OLD.user_id);
        profile_id := COALESCE(NEW.id, OLD.id);
    ELSE
        target_user_id := COALESCE(NEW.user_id, OLD.user_id);
        SELECT id INTO profile_id FROM user_profiles WHERE user_id = target_user_id;
    END IF;
    
    -- Update the completion score
    UPDATE user_profiles 
    SET personalization_score = calculate_profile_completion_score(profile_id)
    WHERE id = profile_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply profile completion triggers
CREATE TRIGGER trigger_update_profile_completion_score
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

CREATE TRIGGER trigger_update_profile_completion_score_people
    AFTER INSERT OR UPDATE OR DELETE ON people
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

CREATE TRIGGER trigger_update_profile_completion_score_music
    AFTER INSERT OR UPDATE OR DELETE ON music_tastes
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

CREATE TRIGGER trigger_update_profile_completion_score_food
    AFTER INSERT OR UPDATE OR DELETE ON food_tastes
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

CREATE TRIGGER trigger_update_profile_completion_score_movies
    AFTER INSERT OR UPDATE OR DELETE ON movie_tastes
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

-- =====================================================
-- EVENT LOGGING FUNCTION
-- =====================================================

-- Function to log user events
CREATE OR REPLACE FUNCTION log_user_event(
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_event_category VARCHAR(50),
    p_event_data JSONB DEFAULT NULL,
    p_session_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO user_events (
        user_id,
        event_type,
        event_category,
        event_data,
        session_id
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_category,
        p_event_data,
        p_session_id
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;
