-- Create the request_history table for storing user request history
CREATE TABLE IF NOT EXISTS request_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  body TEXT,
  response JSONB,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_request_history_user_id ON request_history(user_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_request_history_created_at ON request_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE request_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own history
CREATE POLICY "Users can only see their own request history" ON request_history
  FOR ALL USING (auth.uid() = user_id);
