-- Migration: Add journal entries table
-- This table will store user journal entries with prompts and mission reflections

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    prompt TEXT,
    mission_reflections TEXT[] DEFAULT '{}',
    word_count INTEGER GENERATED ALWAYS AS (
        array_length(string_to_array(trim(content), ' '), 1)
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_word_count ON journal_entries(word_count);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful views
CREATE OR REPLACE VIEW user_journal_stats AS
SELECT 
    user_id,
    COUNT(*) as total_entries,
    SUM(word_count) as total_words,
    AVG(word_count) as avg_words_per_entry,
    MAX(created_at) as last_entry_date,
    COUNT(DISTINCT DATE(created_at)) as unique_days_journaled
FROM journal_entries
GROUP BY user_id;

COMMENT ON TABLE journal_entries IS 'User journal entries with AI-generated prompts and mission reflections';
COMMENT ON COLUMN journal_entries.content IS 'The main journal entry content written by the user';
COMMENT ON COLUMN journal_entries.prompt IS 'The AI-generated prompt that inspired this entry';
COMMENT ON COLUMN journal_entries.mission_reflections IS 'Array of mission IDs that the user reflected on in this entry';
COMMENT ON COLUMN journal_entries.word_count IS 'Automatically calculated word count for analytics';
COMMENT ON COLUMN journal_entries.photos IS 'Array of image URLs or storage references attached to this journal entry';
