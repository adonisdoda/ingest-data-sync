-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    user_id UUID,
    session_id UUID,
    properties JSONB,
    session JSONB,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
