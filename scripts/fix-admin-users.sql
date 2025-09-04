-- Script para identificar y configurar administradores correctamente

-- 1. Identificar quién fue realmente el primer usuario registrado
SELECT 
    'PRIMER USUARIO REGISTRADO:' as info,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    CASE 
        WHEN up.role = 'admin' THEN '✅ Ya es admin'
        ELSE '❌ Necesita ser admin'
    END as status
FROM public.user_profiles up
ORDER BY up.created_at ASC
LIMIT 1;

-- 2. Mostrar todos los usuarios actuales
SELECT 
    'TODOS LOS USUARIOS:' as info,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    ROW_NUMBER() OVER (ORDER BY up.created_at) as orden_registro
FROM public.user_profiles up
ORDER BY up.created_at;

-- 3. Hacer administrador al primer usuario registrado (automático)
UPDATE public.user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = (
    SELECT id FROM public.user_profiles 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- 4. Hacer administrador a timberling45@gmail.com también
UPDATE public.user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'timberling45@gmail.com';

-- 5. Verificar que ambos cambios se aplicaron
SELECT 
    'ADMINISTRADORES CONFIGURADOS:' as resultado,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY up.created_at) = 1 THEN '👑 Primer usuario'
        WHEN up.email = 'timberling45@gmail.com' THEN '🔧 Admin específico'
        ELSE '👤 Usuario regular'
    END as tipo
FROM public.user_profiles up
WHERE up.role = 'admin'
ORDER BY up.created_at;
