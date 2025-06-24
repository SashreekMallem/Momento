-- =====================================================
-- Momento Database Schema Migration
-- Version: 1.0.0
-- Date: June 2025
-- Description: Complete MCP architecture database setup
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. CORE USER DOMAIN
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Auth metadata
    auth_provider VARCHAR(50) DEFAULT 'email',
    auth_provider_id VARCHAR(255),
    
    -- Privacy settings
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Information
    display_name VARCHAR(100),
    date_of_birth DATE,
    timezone VARCHAR(50),
    location JSONB, -- {city, country, coordinates}
    
    -- Onboarding Status
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step VARCHAR(50),
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Life Themes
    life_themes JSONB, -- {selectedThemes, coupleHub, familyMode, timeCommitment, etc.}
    
    -- Preferences
    notification_preferences JSONB, -- {push, email, sms, timing}
    privacy_preferences JSONB, -- {profileVisibility, dataSharing, etc.}
    app_preferences JSONB, -- {theme, language, etc.}
    
    -- Computed fields (updated by triggers)
    engagement_score DECIMAL(3,2) DEFAULT 0.0,
    personalization_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Unique constraint
    UNIQUE(user_id)
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session data
    session_data JSONB,
    device_info JSONB,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 2. RELATIONSHIPS DOMAIN
-- =====================================================

-- Important people
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Information
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    
    -- Contact Information (encrypted)
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Relationship Details
    relationship_strength INTEGER CHECK (relationship_strength BETWEEN 1 AND 10),
    interaction_frequency VARCHAR(20), -- daily, weekly, monthly, rarely
    
    -- Preferences & Notes
    notes TEXT,
    gift_preferences JSONB,
    communication_preferences JSONB,
    
    -- Privacy
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Person interests
CREATE TABLE person_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Interest Details
    interest VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- music, food, movies, hobbies, sports, etc.
    subcategory VARCHAR(50),
    
    -- Relevance & Confidence
    relevance_score DECIMAL(3,2) DEFAULT 1.0 CHECK (relevance_score BETWEEN 0 AND 1),
    confidence_score DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- Source of information
    source VARCHAR(50) DEFAULT 'user_input',
    
    -- Unique constraint
    UNIQUE(person_id, interest, category)
);

-- Important dates
CREATE TABLE important_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Date Information
    date_value DATE NOT NULL,
    date_type VARCHAR(50) NOT NULL, -- birthday, anniversary, holiday, custom
    description VARCHAR(200),
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT TRUE,
    recurrence_pattern VARCHAR(20) DEFAULT 'yearly',
    
    -- Importance & Reminders
    importance_level INTEGER DEFAULT 5 CHECK (importance_level BETWEEN 1 AND 10),
    reminder_days_before INTEGER[] DEFAULT ARRAY[7, 1],
    
    -- Unique constraint
    UNIQUE(person_id, date_value, date_type)
);

-- =====================================================
-- 3. TASTES DOMAIN
-- =====================================================

-- Music tastes
CREATE TABLE music_tastes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Music Preferences
    genres TEXT[] NOT NULL DEFAULT '{}',
    favorite_artists TEXT[] DEFAULT '{}',
    favorite_songs TEXT[] DEFAULT '{}',
    custom_genres TEXT[] DEFAULT '{}',
    
    -- Contextual Preferences
    music_moods TEXT[] DEFAULT '{}',
    preferred_platforms TEXT[] DEFAULT '{}',
    
    -- Listening Patterns
    preferred_listening_times TEXT[] DEFAULT '{}',
    volume_preference VARCHAR(20),
    
    -- Discovery Preferences
    discovery_openness INTEGER DEFAULT 5 CHECK (discovery_openness BETWEEN 1 AND 10),
    preferred_discovery_method TEXT[] DEFAULT '{}',
    
    -- Unique constraint
    UNIQUE(user_id)
);

-- Food tastes
CREATE TABLE food_tastes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Food Preferences
    cuisines TEXT[] NOT NULL DEFAULT '{}',
    favorite_dishes TEXT[] DEFAULT '{}',
    favorite_restaurants TEXT[] DEFAULT '{}',
    custom_cuisines TEXT[] DEFAULT '{}',
    
    -- Dietary Information
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    spice_tolerance VARCHAR(20),
    
    -- Cooking & Dining
    cooking_interests TEXT[] DEFAULT '{}',
    preferred_meal_types TEXT[] DEFAULT '{}',
    dining_preferences TEXT[] DEFAULT '{}',
    
    -- Discovery & Platforms
    preferred_platforms TEXT[] DEFAULT '{}',
    discovery_openness INTEGER DEFAULT 5 CHECK (discovery_openness BETWEEN 1 AND 10),
    
    -- Budget Preferences
    budget_range VARCHAR(20),
    
    -- Unique constraint
    UNIQUE(user_id)
);

-- Movie tastes
CREATE TABLE movie_tastes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Movie Preferences
    genres TEXT[] NOT NULL DEFAULT '{}',
    favorite_movies TEXT[] DEFAULT '{}',
    favorite_directors TEXT[] DEFAULT '{}',
    favorite_actors TEXT[] DEFAULT '{}',
    custom_genres TEXT[] DEFAULT '{}',
    
    -- Viewing Preferences
    movie_moods TEXT[] DEFAULT '{}',
    preferred_platforms TEXT[] DEFAULT '{}',
    favorite_decades TEXT[] DEFAULT '{}',
    
    -- Content Preferences
    preferred_movie_length VARCHAR(20),
    content_rating_preference TEXT[] DEFAULT '{}',
    subtitle_preference VARCHAR(20),
    
    -- Viewing Context
    preferred_viewing_times TEXT[] DEFAULT '{}',
    viewing_environment TEXT[] DEFAULT '{}',
    
    -- Discovery
    discovery_openness INTEGER DEFAULT 5 CHECK (discovery_openness BETWEEN 1 AND 10),
    review_source_preference TEXT[] DEFAULT '{}',
    
    -- Unique constraint
    UNIQUE(user_id)
);

-- =====================================================
-- 4. MISSIONS DOMAIN
-- =====================================================

-- Missions
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Mission Content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(50) NOT NULL,
    mission_category VARCHAR(50) NOT NULL,
    
    -- Personalization
    personalized_elements JSONB,
    
    -- Execution Details
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- minutes
    required_resources TEXT[] DEFAULT '{}',
    scheduling_flexibility VARCHAR(20) DEFAULT 'flexible',
    
    -- Learning & Skills
    learning_objectives TEXT[] DEFAULT '{}',
    skills_reinforced TEXT[] DEFAULT '{}',
    
    -- Status & Tracking
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'scheduled', 'active', 'completed', 'skipped', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Generation Metadata
    generation_model VARCHAR(50),
    prompt_version VARCHAR(20),
    context_snapshot JSONB,
    generation_cost DECIMAL(10,6),
    
    -- Performance Metrics
    engagement_score DECIMAL(3,2),
    completion_likelihood DECIMAL(3,2)
);

-- Mission feedback
CREATE TABLE mission_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Feedback Ratings
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    relevance_rating INTEGER CHECK (relevance_rating BETWEEN 1 AND 5),
    enjoyment_rating INTEGER CHECK (enjoyment_rating BETWEEN 1 AND 5),
    
    -- Detailed Feedback
    feedback_text TEXT,
    what_worked_well TEXT,
    what_could_improve TEXT,
    
    -- Emotional Response
    emotions_before TEXT[] DEFAULT '{}',
    emotions_after TEXT[] DEFAULT '{}',
    
    -- Completion Details
    completion_status VARCHAR(20) NOT NULL,
    time_spent INTEGER, -- minutes
    difficulty_experienced VARCHAR(20),
    
    -- Adaptation Requests
    wants_similar_missions BOOLEAN,
    wants_more_challenging BOOLEAN,
    wants_less_challenging BOOLEAN,
    suggested_improvements TEXT,
    
    -- Privacy
    is_anonymous BOOLEAN DEFAULT FALSE,
    share_with_community BOOLEAN DEFAULT FALSE,
    
    -- Unique constraint
    UNIQUE(mission_id, user_id)
);

-- Mission schedule
CREATE TABLE mission_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Scheduling Details
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduling_type VARCHAR(20) NOT NULL,
    
    -- Reminder Configuration
    reminder_settings JSONB,
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'reminded', 'missed', 'rescheduled', 'cancelled')),
    
    -- Rescheduling History
    original_scheduled_for TIMESTAMP WITH TIME ZONE,
    reschedule_count INTEGER DEFAULT 0,
    reschedule_reason VARCHAR(100),
    
    -- Notification Tracking
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_opened_at TIMESTAMP WITH TIME ZONE,
    mission_opened_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint
    UNIQUE(mission_id)
);

-- =====================================================
-- 5. ANALYTICS & LEARNING DOMAIN
-- =====================================================

-- User events
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Event Classification
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    
    -- Event Data
    event_data JSONB,
    
    -- Context
    session_id UUID,
    device_info JSONB,
    app_version VARCHAR(20),
    
    -- User State
    user_journey_stage VARCHAR(50)
);

-- Behavioral patterns
CREATE TABLE behavioral_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Pattern Classification
    pattern_type VARCHAR(50) NOT NULL,
    pattern_subtype VARCHAR(50),
    
    -- Pattern Data
    pattern_data JSONB NOT NULL,
    
    -- Pattern Metadata
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    sample_size INTEGER NOT NULL,
    time_period_days INTEGER NOT NULL,
    
    -- Pattern Validation
    validation_status VARCHAR(20) DEFAULT 'detected' CHECK (validation_status IN ('detected', 'validated', 'invalidated')),
    validation_date TIMESTAMP WITH TIME ZONE,
    
    -- Impact Assessment
    impact_score DECIMAL(3,2),
    actionable BOOLEAN DEFAULT TRUE,
    
    -- Unique constraint
    UNIQUE(user_id, pattern_type, pattern_subtype)
);

-- Embeddings
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Entity Reference
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Embedding Data
    embedding VECTOR(1536), -- OpenAI embedding dimension
    embedding_model VARCHAR(50) NOT NULL,
    embedding_version VARCHAR(20),
    
    -- Metadata
    metadata JSONB,
    
    -- Content Hash (for deduplication)
    content_hash VARCHAR(64),
    
    -- Unique constraint
    UNIQUE(entity_type, entity_id, embedding_model)
);
