-- Fix infinite recursion in RLS policies
-- The issue is that policies are checking user_profiles table, which causes recursion
-- Solution: Create a SECURITY DEFINER function to check admin role without triggering RLS

-- Create a function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin by querying user_profiles
  -- SECURITY DEFINER allows this function to bypass RLS
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- Fix rules policies
DROP POLICY IF EXISTS "Fortune tellers can manage their own rules" ON public.rules;
DROP POLICY IF EXISTS "Admins can manage all rules" ON public.rules;

CREATE POLICY "Fortune tellers can manage their own rules"
  ON public.rules FOR ALL
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

CREATE POLICY "Admins can manage all rules"
  ON public.rules FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Fix rule_generations policies
DROP POLICY IF EXISTS "Users can manage generations for their rules" ON public.rule_generations;
CREATE POLICY "Users can manage generations for their rules"
  ON public.rule_generations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rules
      WHERE id = rule_generations.rule_id
      AND (fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rules
      WHERE id = rule_generations.rule_id
      AND (fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Fix rule_rows policies
DROP POLICY IF EXISTS "Users can manage rows for their generations" ON public.rule_rows;
CREATE POLICY "Users can manage rows for their generations"
  ON public.rule_rows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rule_generations rg
      JOIN public.rules r ON r.id = rg.rule_id
      WHERE rg.id = rule_rows.generation_id
      AND (r.fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rule_generations rg
      JOIN public.rules r ON r.id = rg.rule_id
      WHERE rg.id = rule_rows.generation_id
      AND (r.fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Fix images policies
DROP POLICY IF EXISTS "Fortune tellers can manage their own images" ON public.images;
DROP POLICY IF EXISTS "Admins can manage all images" ON public.images;

-- Fortune tellers can manage their own images (SELECT, UPDATE, DELETE)
CREATE POLICY "Fortune tellers can manage their own images"
  ON public.images FOR SELECT
  USING (fortune_teller_id = auth.uid());

CREATE POLICY "Fortune tellers can insert their own images"
  ON public.images FOR INSERT
  WITH CHECK (fortune_teller_id = auth.uid());

CREATE POLICY "Fortune tellers can update their own images"
  ON public.images FOR UPDATE
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

CREATE POLICY "Fortune tellers can delete their own images"
  ON public.images FOR DELETE
  USING (fortune_teller_id = auth.uid());

-- Admins can manage all images
CREATE POLICY "Admins can view all images"
  ON public.images FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert images"
  ON public.images FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all images"
  ON public.images FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all images"
  ON public.images FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Fix fortune_types policies
DROP POLICY IF EXISTS "Fortune tellers can manage their own fortune types" ON public.fortune_types;
DROP POLICY IF EXISTS "Admins can manage all fortune types" ON public.fortune_types;

CREATE POLICY "Fortune tellers can manage their own fortune types"
  ON public.fortune_types FOR ALL
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

CREATE POLICY "Admins can manage all fortune types"
  ON public.fortune_types FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Fix fortune_message_templates policies
DROP POLICY IF EXISTS "Users can manage templates for their fortune types" ON public.fortune_message_templates;
CREATE POLICY "Users can manage templates for their fortune types"
  ON public.fortune_message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.fortune_types
      WHERE fortune_type_id = fortune_message_templates.fortune_type_id
      AND (fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fortune_types
      WHERE fortune_type_id = fortune_message_templates.fortune_type_id
      AND (fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Fix fortune_message_mappings policies
DROP POLICY IF EXISTS "Users can view mappings for their templates" ON public.fortune_message_mappings;
CREATE POLICY "Users can view mappings for their templates"
  ON public.fortune_message_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fortune_message_templates fmt
      JOIN public.fortune_types ft ON ft.fortune_type_id = fmt.fortune_type_id
      WHERE fmt.template_id = fortune_message_mappings.template_id
      AND (ft.fortune_teller_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

