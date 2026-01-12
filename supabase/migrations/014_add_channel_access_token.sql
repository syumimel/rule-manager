-- Add channel_access_token column to line_settings table
ALTER TABLE public.line_settings
ADD COLUMN IF NOT EXISTS channel_access_token TEXT;

-- Add comment
COMMENT ON COLUMN public.line_settings.channel_access_token IS 'LINE Channel Access Token for sending messages';

