-- =====================================================
-- Momento Database Views and Analytics
-- Version: 1.0.0
-- Date: June 2025
-- Description: Views and materialized views for analytics
-- =====================================================

-- =====================================================
-- REGULAR VIEWS
-- =====================================================

-- User overview view
CREATE VIEW user_overview AS
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    u.last_active_at,
    u.status as user_status,
    
    -- Profile information
    up.display_name,
    up.onboarding_completed,
    up.personalization_score,
    up.engagement_score,
    
    -- Relationship counts
    (SELECT COUNT(*) FROM people p WHERE p.user_id = u.id AND p.deleted_at IS NULL) as people_count,
    
    -- Taste profile completion
    (SELECT COUNT(*) FROM music_tastes mt WHERE mt.user_id = u.id) > 0 as has_music_tastes,
    (SELECT COUNT(*) FROM food_tastes ft WHERE ft.user_id = u.id) > 0 as has_food_tastes,
    (SELECT COUNT(*) FROM movie_tastes mov WHERE mov.user_id = u.id) > 0 as has_movie_tastes,
    
    -- Mission statistics
    (SELECT COUNT(*) FROM missions m WHERE m.user_id = u.id) as total_missions,
    (SELECT COUNT(*) FROM missions m WHERE m.user_id = u.id AND m.status = 'completed') as completed_missions,
    (SELECT COUNT(*) FROM missions m WHERE m.user_id = u.id AND m.status = 'active') as active_missions,
    
    -- Engagement metrics
    (SELECT AVG(overall_rating) FROM mission_feedback mf JOIN missions m ON m.id = mf.mission_id WHERE m.user_id = u.id) as avg_mission_rating,
    (SELECT MAX(created_at) FROM user_events ue WHERE ue.user_id = u.id) as last_event_at

FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.deleted_at IS NULL;

-- Mission analytics view
CREATE VIEW mission_analytics AS
SELECT 
    m.id as mission_id,
    m.user_id,
    m.title,
    m.mission_type,
    m.mission_category,
    m.difficulty,
    m.status,
    m.created_at,
    m.scheduled_for,
    m.completed_at,
    m.generation_model,
    
    -- Feedback metrics
    mf.overall_rating,
    mf.difficulty_rating,
    mf.relevance_rating,
    mf.enjoyment_rating,
    mf.completion_status,
    mf.time_spent,
    mf.wants_similar_missions,
    mf.wants_more_challenging,
    mf.wants_less_challenging,
    
    -- Scheduling info
    ms.scheduling_type,
    ms.reschedule_count,
    
    -- Timing metrics
    EXTRACT(EPOCH FROM (m.completed_at - m.created_at))/3600 as hours_to_complete,
    EXTRACT(EPOCH FROM (m.activated_at - m.created_at))/3600 as hours_to_activate,
    
    -- User context
    up.personalization_score,
    up.engagement_score

FROM missions m
LEFT JOIN mission_feedback mf ON m.id = mf.mission_id
LEFT JOIN mission_schedule ms ON m.id = ms.mission_id
LEFT JOIN user_profiles up ON m.user_id = up.user_id;

-- User context view (for mission generation)
CREATE VIEW user_context AS
SELECT 
    u.id as user_id,
    up.life_themes,
    up.display_name,
    up.location,
    up.personalization_score,
    up.engagement_score,
    
    -- People summary
    COALESCE(people_summary.people_data, '[]'::jsonb) as important_people,
    
    -- Taste profiles
    COALESCE(mt.genres, ARRAY[]::text[]) as music_genres,
    COALESCE(mt.music_moods, ARRAY[]::text[]) as music_moods,
    COALESCE(ft.cuisines, ARRAY[]::text[]) as food_cuisines,
    COALESCE(ft.dietary_restrictions, ARRAY[]::text[]) as dietary_restrictions,
    COALESCE(mov.genres, ARRAY[]::text[]) as movie_genres,
    COALESCE(mov.movie_moods, ARRAY[]::text[]) as movie_moods,
    
    -- Recent mission performance
    COALESCE(recent_performance.avg_rating, 0) as recent_mission_rating,
    COALESCE(recent_performance.completion_rate, 0) as recent_completion_rate

FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN music_tastes mt ON u.id = mt.user_id
LEFT JOIN food_tastes ft ON u.id = ft.user_id
LEFT JOIN movie_tastes mov ON u.id = mov.user_id
LEFT JOIN (
    SELECT 
        user_id,
        jsonb_agg(
            jsonb_build_object(
                'name', name,
                'relationship', relationship,
                'interests', COALESCE(interests_agg.interests, ARRAY[]::text[])
            )
        ) as people_data
    FROM people p
    LEFT JOIN (
        SELECT 
            person_id,
            array_agg(interest) as interests
        FROM person_interests
        GROUP BY person_id
    ) interests_agg ON p.id = interests_agg.person_id
    WHERE p.deleted_at IS NULL
    GROUP BY user_id
) people_summary ON u.id = people_summary.user_id
LEFT JOIN (
    SELECT 
        m.user_id,
        AVG(mf.overall_rating) as avg_rating,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END)::float / COUNT(*) as completion_rate
    FROM missions m
    LEFT JOIN mission_feedback mf ON m.id = mf.mission_id
    WHERE m.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY m.user_id
) recent_performance ON u.id = recent_performance.user_id
WHERE u.deleted_at IS NULL;

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Daily user activity summary
CREATE MATERIALIZED VIEW daily_user_activity AS
SELECT 
    DATE(created_at) as activity_date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE event_type = 'mission_complete') as missions_completed,
    COUNT(*) FILTER (WHERE event_type = 'app_open') as app_opens,
    COUNT(*) FILTER (WHERE event_type = 'onboarding_step') as onboarding_steps,
    COUNT(*) FILTER (WHERE event_type = 'mission_start') as missions_started,
    COUNT(*) FILTER (WHERE event_type = 'feedback_submit') as feedback_submitted
FROM user_events
GROUP BY DATE(created_at)
ORDER BY activity_date;

-- Create unique index for efficient refreshes
CREATE UNIQUE INDEX ON daily_user_activity (activity_date);

-- Mission performance summary
CREATE MATERIALIZED VIEW mission_performance_summary AS
SELECT 
    mission_type,
    mission_category,
    difficulty,
    generation_model,
    COUNT(*) as total_missions,
    AVG(overall_rating) as avg_rating,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'completed')::FLOAT / COUNT(*) as completion_rate,
    AVG(time_spent) FILTER (WHERE time_spent IS NOT NULL) as avg_time_spent,
    AVG(relevance_rating) as avg_relevance,
    AVG(enjoyment_rating) as avg_enjoyment,
    COUNT(*) FILTER (WHERE wants_similar_missions = true) as want_similar_count
FROM mission_analytics
WHERE created_at >= NOW() - INTERVAL '90 days' -- Last 90 days
GROUP BY mission_type, mission_category, difficulty, generation_model
ORDER BY completion_rate DESC, avg_rating DESC;

-- Create unique index
CREATE UNIQUE INDEX ON mission_performance_summary (mission_type, mission_category, difficulty, generation_model);

-- User engagement summary
CREATE MATERIALIZED VIEW user_engagement_summary AS
SELECT 
    DATE_TRUNC('week', u.created_at) as signup_week,
    COUNT(*) as new_users,
    COUNT(*) FILTER (WHERE up.onboarding_completed = true) as completed_onboarding,
    AVG(up.personalization_score) as avg_personalization_score,
    AVG(up.engagement_score) as avg_engagement_score,
    
    -- Mission metrics
    COUNT(*) FILTER (WHERE mission_stats.total_missions > 0) as users_with_missions,
    AVG(mission_stats.total_missions) as avg_missions_per_user,
    AVG(mission_stats.completion_rate) as avg_completion_rate,
    
    -- Retention proxy (users active in last 7 days)
    COUNT(*) FILTER (WHERE u.last_active_at >= NOW() - INTERVAL '7 days') as active_last_7_days

FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_missions,
        COUNT(*) FILTER (WHERE status = 'completed')::FLOAT / COUNT(*) as completion_rate
    FROM missions
    GROUP BY user_id
) mission_stats ON u.id = mission_stats.user_id
WHERE u.deleted_at IS NULL
GROUP BY DATE_TRUNC('week', u.created_at)
ORDER BY signup_week;

-- Create unique index
CREATE UNIQUE INDEX ON user_engagement_summary (signup_week);

-- Taste preference trends
CREATE MATERIALIZED VIEW taste_preference_trends AS
SELECT 
    'music' as taste_type,
    unnest(genres) as preference,
    COUNT(*) as user_count,
    AVG(discovery_openness) as avg_discovery_openness
FROM music_tastes
GROUP BY unnest(genres)

UNION ALL

SELECT 
    'food' as taste_type,
    unnest(cuisines) as preference,
    COUNT(*) as user_count,
    AVG(discovery_openness) as avg_discovery_openness
FROM food_tastes
GROUP BY unnest(cuisines)

UNION ALL

SELECT 
    'movie' as taste_type,
    unnest(genres) as preference,
    COUNT(*) as user_count,
    AVG(discovery_openness) as avg_discovery_openness
FROM movie_tastes
GROUP BY unnest(genres)

ORDER BY user_count DESC;

-- Create index for efficient queries
CREATE INDEX ON taste_preference_trends (taste_type, user_count DESC);

-- =====================================================
-- FUNCTIONS TO REFRESH MATERIALIZED VIEWS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_user_activity;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mission_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY taste_preference_trends;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh views for specific date range
CREATE OR REPLACE FUNCTION refresh_recent_analytics()
RETURNS void AS $$
BEGIN
    -- Only refresh views that might have changed with recent data
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_user_activity;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mission_performance_summary;
END;
$$ LANGUAGE plpgsql;
