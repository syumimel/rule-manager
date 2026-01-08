-- Fix images table RLS policies for INSERT operations
-- Drop all existing policies on images table
DROP POLICY IF EXISTS "Fortune tellers can manage their own images" ON public.images;
DROP POLICY IF EXISTS "Fortune tellers can insert their own images" ON public.images;
DROP POLICY IF EXISTS "Fortune tellers can update their own images" ON public.images;
DROP POLICY IF EXISTS "Fortune tellers can delete their own images" ON public.images;
DROP POLICY IF EXISTS "Admins can view all images" ON public.images;
DROP POLICY IF EXISTS "Admins can insert images" ON public.images;
DROP POLICY IF EXISTS "Admins can update all images" ON public.images;
DROP POLICY IF EXISTS "Admins can delete all images" ON public.images;

-- Create new policies with proper WITH CHECK clauses for INSERT

-- Fortune tellers can SELECT their own images
CREATE POLICY "Fortune tellers can view their own images"
  ON public.images FOR SELECT
  USING (fortune_teller_id = auth.uid());

-- Fortune tellers can INSERT their own images
-- WITH CHECK ensures the inserted row has the correct fortune_teller_id
CREATE POLICY "Fortune tellers can insert their own images"
  ON public.images FOR INSERT
  WITH CHECK (fortune_teller_id = auth.uid());

-- Fortune tellers can UPDATE their own images
CREATE POLICY "Fortune tellers can update their own images"
  ON public.images FOR UPDATE
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

-- Fortune tellers can DELETE their own images
CREATE POLICY "Fortune tellers can delete their own images"
  ON public.images FOR DELETE
  USING (fortune_teller_id = auth.uid());

-- Admins can SELECT all images
CREATE POLICY "Admins can view all images"
  ON public.images FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can INSERT images
CREATE POLICY "Admins can insert images"
  ON public.images FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can UPDATE all images
CREATE POLICY "Admins can update all images"
  ON public.images FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can DELETE all images
CREATE POLICY "Admins can delete all images"
  ON public.images FOR DELETE
  USING (public.is_admin(auth.uid()));



