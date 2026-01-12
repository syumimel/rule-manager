-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add webhook_id column to line_settings table
ALTER TABLE public.line_settings
ADD COLUMN IF NOT EXISTS webhook_id UUID;

-- Generate webhook_id for existing records
UPDATE public.line_settings
SET webhook_id = uuid_generate_v4()
WHERE webhook_id IS NULL;

-- Create unique index on webhook_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_line_settings_webhook_id ON public.line_settings(webhook_id);

-- Add comment
COMMENT ON COLUMN public.line_settings.webhook_id IS 'Unique webhook ID for account-specific webhook URLs';

