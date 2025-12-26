-- Add 'status' column if it doesn't exist
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Scheduled';

-- Add check constraint for 'status' (safely, as adding constraint with existing bad data might fail, but assuming clean or new table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_status_check') THEN
        ALTER TABLE tours ADD CONSTRAINT tours_status_check CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Pending'));
    END IF;
END $$;

-- Add 'visitor_ids' column (Array of Integers)
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS visitor_ids INTEGER[];

-- Add 'created_at' column
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
