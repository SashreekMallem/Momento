-- Migration: Create life_chapters table

CREATE TABLE life_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image_url TEXT,
    gpt_summary TEXT,
    gpt_story TEXT,
    raw_data JSONB, -- includes all missions, journals, time capsules, and photo URLs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_life_chapters_user_id ON life_chapters(user_id);
CREATE INDEX idx_life_chapters_created_at ON life_chapters(created_at DESC);
CREATE INDEX idx_life_chapters_start_end ON life_chapters(start_date, end_date);
