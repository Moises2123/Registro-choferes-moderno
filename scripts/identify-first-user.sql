-- Script para identificar quién fue el primer usuario y su estado actual

-- Ver todos los usuarios en orden de registro
SELECT 
    ROW_NUMBER() OVER (ORDER BY created_at) as "#",
    email,
    full_name,
    role,
    created_at,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY created_at) = 1 THEN '👑 PRIMER USUARIO - Debería ser admin'
        WHEN email = 'timberling45@gmail.com' THEN '🔧 Usuario específico solicitado'
        WHEN role = 'admin' THEN '👨‍💼 Ya es admin'
        ELSE '👤 Usuario regular'
    END as estado_recomendado
FROM public.user_profiles
ORDER BY created_at;

-- Ver quién tiene acceso actualmente a los registros
SELECT 
    '🔐 ACCESO ACTUAL AL SISTEMA:' as info,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as total_users,
    COUNT(*) as total_usuarios
FROM public.user_profiles;

-- Mostrar el primer usuario específicamente
SELECT 
    '👑 PRIMER USUARIO REGISTRADO:' as titulo,
    email,
    full_name,
    role,
    created_at,
    CASE 
        WHEN role = 'admin' THEN '✅ Ya tiene acceso completo'
        ELSE '❌ Necesita ser configurado como admin'
    END as necesita_accion
FROM public.user_profiles
ORDER BY created_at ASC
LIMIT 1;
