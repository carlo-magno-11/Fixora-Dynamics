DROP POLICY IF EXISTS eyesite_media_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS eyesite_media_owner_or_admin_delete ON storage.objects;
DROP POLICY IF EXISTS eyesite_media_owner_or_admin_update ON storage.objects;
DROP POLICY IF EXISTS eyesite_media_public_read ON storage.objects;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.current_profile_role(uuid);
DROP FUNCTION IF EXISTS public.current_profile_estado(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
