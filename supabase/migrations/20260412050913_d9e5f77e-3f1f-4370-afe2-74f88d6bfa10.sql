DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_role_only(auth.uid()) = 'admin');

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.check_user_role_only(auth.uid()) = 'admin')
WITH CHECK (public.check_user_role_only(auth.uid()) = 'admin');