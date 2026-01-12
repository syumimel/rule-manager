-- Add fortune_teller_id column to message_logs table
ALTER TABLE public.message_logs
ADD COLUMN IF NOT EXISTS fortune_teller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_message_logs_fortune_teller_id ON public.message_logs(fortune_teller_id);

-- Update RLS policy to filter by fortune_teller_id
DROP POLICY IF EXISTS "Users can view their own message logs" ON public.message_logs;
CREATE POLICY "Users can view their own message logs"
  ON public.message_logs FOR SELECT
  USING (fortune_teller_id = auth.uid());

-- Allow admins to view all message logs
DROP POLICY IF EXISTS "Admins can view all message logs" ON public.message_logs;
CREATE POLICY "Admins can view all message logs"
  ON public.message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update INSERT policy to require fortune_teller_id
DROP POLICY IF EXISTS "System can insert message logs" ON public.message_logs;
CREATE POLICY "Users can insert their own message logs"
  ON public.message_logs FOR INSERT
  WITH CHECK (fortune_teller_id = auth.uid());

-- Allow system (adminClient) to insert message logs
CREATE POLICY "System can insert message logs"
  ON public.message_logs FOR INSERT
  WITH CHECK (true);

-- Comment
COMMENT ON COLUMN public.message_logs.fortune_teller_id IS 'Fortune teller ID who owns this message log';

