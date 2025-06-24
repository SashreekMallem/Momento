-- =====================================================
-- Fix Recursive Trigger Issue
-- Version: 1.0.0
-- Date: June 2025  
-- Description: Fix infinite recursion in profile completion score triggers
-- =====================================================

-- Drop existing problematic triggers
DROP TRIGGER IF EXISTS trigger_update_profile_completion_score ON user_profiles;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_score_people ON people;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_score_music ON music_tastes;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_score_food ON food_tastes;
DROP TRIGGER IF EXISTS trigger_update_profile_completion_score_movies ON movie_tastes;

-- Drop the problematic function
DROP FUNCTION IF EXISTS update_profile_completion_score();

-- Create a safer version that doesn't cause recursion
CREATE OR REPLACE FUNCTION update_profile_completion_score_safe()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    profile_id UUID;
    new_score DECIMAL(3,2);
BEGIN
    -- Determine the user_id based on the table being updated
    IF TG_TABLE_NAME = 'user_profiles' THEN
        -- Skip if this is just a personalization_score update to avoid recursion
        IF OLD IS NOT NULL AND NEW IS NOT NULL AND 
           OLD.personalization_score IS DISTINCT FROM NEW.personalization_score AND
           (OLD.display_name IS NOT DISTINCT FROM NEW.display_name AND
            OLD.date_of_birth IS NOT DISTINCT FROM NEW.date_of_birth AND  
            OLD.location IS NOT DISTINCT FROM NEW.location AND
            OLD.life_themes IS NOT DISTINCT FROM NEW.life_themes) THEN
            RETURN NEW; -- Skip personalization_score-only updates
        END IF;
        
        target_user_id := COALESCE(NEW.user_id, OLD.user_id);
        profile_id := COALESCE(NEW.id, OLD.id);
    ELSE
        target_user_id := COALESCE(NEW.user_id, OLD.user_id);
        SELECT id INTO profile_id FROM user_profiles WHERE user_id = target_user_id;
    END IF;
    
    -- Calculate new score
    new_score := calculate_profile_completion_score(profile_id);
    
    -- Update the completion score only if it's different (prevent unnecessary updates)
    UPDATE user_profiles 
    SET personalization_score = new_score
    WHERE id = profile_id AND (personalization_score IS NULL OR personalization_score != new_score);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply the safer profile completion triggers
CREATE TRIGGER trigger_update_profile_completion_score_safe
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score_safe();

CREATE TRIGGER trigger_update_profile_completion_score_people_safe
    AFTER INSERT OR UPDATE OR DELETE ON people
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score_safe();

CREATE TRIGGER trigger_update_profile_completion_score_music_safe
    AFTER INSERT OR UPDATE OR DELETE ON music_tastes
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score_safe();

CREATE TRIGGER trigger_update_profile_completion_score_food_safe
    AFTER INSERT OR UPDATE OR DELETE ON food_tastes
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score_safe();

CREATE TRIGGER trigger_update_profile_completion_score_movies_safe
    AFTER INSERT OR UPDATE OR DELETE ON movie_tastes
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score_safe();

-- Add comment explaining the fix
COMMENT ON FUNCTION update_profile_completion_score_safe() IS 
'Safe version of profile completion score update that avoids infinite recursion by skipping personalization_score-only updates';
