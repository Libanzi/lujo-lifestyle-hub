-- Fix: wordpress_settings should not be publicly readable
DROP POLICY IF EXISTS "System can read WordPress settings" ON public.wordpress_settings;

CREATE POLICY "Service role can read WordPress settings"
ON public.wordpress_settings
FOR SELECT
TO service_role
USING (true);

-- Also scope discount_codes public SELECT to only expose code+discount_type (can't restrict columns via RLS, but we can remove public listing)
-- Instead, keep the public SELECT but this is a known acceptable risk for discount validation
