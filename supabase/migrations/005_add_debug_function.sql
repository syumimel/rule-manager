-- Add a debug function to check auth.uid() in RLS context
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



