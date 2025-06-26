-- Migration: Create mission_ideas table for reusable, adaptable mission templates
CREATE TABLE IF NOT EXISTS mission_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(50) NOT NULL,
    mission_category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER,
    required_resources TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    source_type VARCHAR(50) NOT NULL, -- 'ai_generated', 'user_submitted', 'admin_curated'
    source_user_id UUID REFERENCES users(id),
    original_mission_id UUID REFERENCES missions(id),
    is_active BOOLEAN DEFAULT true,
    moderation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderation_notes TEXT,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.0,
    user_rating DECIMAL(3,2) DEFAULT 0.0
);

-- Index for fast search by type/category/tags
CREATE INDEX IF NOT EXISTS idx_mission_ideas_type ON mission_ideas(mission_type);
CREATE INDEX IF NOT EXISTS idx_mission_ideas_category ON mission_ideas(mission_category);
CREATE INDEX IF NOT EXISTS idx_mission_ideas_tags ON mission_ideas USING GIN(tags);
