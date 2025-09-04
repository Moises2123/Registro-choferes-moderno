-- Script para hacer administrador a un usuario específico
-- Ejecutar este script en Supabase SQL Editor

-- Hacer administrador al usuario timberling45@gmail.com
UPDATE public.user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'timberling45@gmail.com';

-- Verificar que el cambio se aplicó correctamente
SELECT 
    email, 
    full_name, 
    role, 
    created_at,
    updated_at
FROM public.user_profiles 
WHERE email = 'timberling45@gmail.com';

-- Si el usuario no existe en user_profiles pero sí en auth.users, crearlo como admin
INSERT INTO public.user_profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'timberling45@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.email = 'timberling45@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Mostrar resultado final
SELECT 
    'Usuario configurado como administrador' as status,
    email, 
    full_name, 
    role, 
    created_at
FROM public.user_profiles 
WHERE email = 'timberling45@gmail.com';
