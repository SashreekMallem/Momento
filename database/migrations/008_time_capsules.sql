-- Migration: Create time_capsules table

CREATE TABLE time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    unlock_date DATE NOT NULL,
    photo_urls TEXT[] DEFAULT '{}', -- Array of photo URLs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and scalability
CREATE INDEX idx_time_capsules_user_id ON time_capsules(user_id);
CREATE INDEX idx_time_capsules_unlock_date ON time_capsules(unlock_date);
CREATE INDEX idx_time_capsules_created_at ON time_capsules(created_at DESC);

-- (Optional) For full-text search on title/message
CREATE INDEX idx_time_capsules_fts ON time_capsules USING GIN (to_tsvector('english', title || ' ' || message));
