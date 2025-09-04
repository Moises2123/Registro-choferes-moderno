-- Script completo para configurar administradores correctamente

-- PASO 1: Análisis de la situación actual
DO $$
DECLARE
    primer_usuario_email TEXT;
    primer_usuario_id UUID;
    primer_usuario_es_admin BOOLEAN;
    tim_existe BOOLEAN;
    tim_es_admin BOOLEAN;
BEGIN
    -- Obtener información del primer usuario
    SELECT email, id, (role = 'admin') 
    INTO primer_usuario_email, primer_usuario_id, primer_usuario_es_admin
    FROM public.user_profiles 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Verificar estado de timberling45@gmail.com
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE email = 'timberling45@gmail.com'),
           EXISTS(SELECT 1 FROM public.user_profiles WHERE email = 'timberling45@gmail.com' AND role = 'admin')
    INTO tim_existe, tim_es_admin;
    
    -- Mostrar análisis
    RAISE NOTICE '=== ANÁLISIS ACTUAL ===';
    RAISE NOTICE 'Primer usuario registrado: % (ID: %)', primer_usuario_email, primer_usuario_id;
    RAISE NOTICE 'Primer usuario es admin: %', primer_usuario_es_admin;
    RAISE NOTICE 'timberling45@gmail.com existe: %', tim_existe;
    RAISE NOTICE 'timberling45@gmail.com es admin: %', tim_es_admin;
    
    -- PASO 2: Hacer correcciones
    RAISE NOTICE '=== APLICANDO CORRECCIONES ===';
    
    -- Hacer admin al primer usuario si no lo es
    IF NOT primer_usuario_es_admin THEN
        UPDATE public.user_profiles 
        SET role = 'admin', updated_at = NOW()
        WHERE id = primer_usuario_id;
        RAISE NOTICE 'Primer usuario % configurado como admin', primer_usuario_email;
    ELSE
        RAISE NOTICE 'Primer usuario % ya era admin', primer_usuario_email;
    END IF;
    
    -- Hacer admin a timberling45@gmail.com si existe y no es admin
    IF tim_existe AND NOT tim_es_admin THEN
        UPDATE public.user_profiles 
        SET role = 'admin', updated_at = NOW()
        WHERE email = 'timberling45@gmail.com';
        RAISE NOTICE 'timberling45@gmail.com configurado como admin';
    ELSIF tim_existe AND tim_es_admin THEN
        RAISE NOTICE 'timberling45@gmail.com ya era admin';
    ELSIF NOT tim_existe THEN
        RAISE NOTICE 'timberling45@gmail.com no existe en el sistema';
    END IF;
END $$;

-- PASO 3: Mostrar resultado final
SELECT 
    '🎯 CONFIGURACIÓN FINAL' as status,
    email,
    full_name,
    role,
    created_at,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY created_at) = 1 THEN '👑 PRIMER USUARIO (Admin automático)'
        WHEN email = 'timberling45@gmail.com' THEN '🔧 ADMIN ESPECÍFICO'
        WHEN role = 'admin' THEN '👨‍💼 OTRO ADMIN'
        ELSE '👤 Usuario regular'
    END as descripcion
FROM public.user_profiles
ORDER BY 
    CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
    created_at;

-- PASO 4: Verificar acceso a registros
SELECT 
    '📊 RESUMEN DE REGISTROS' as info,
    COUNT(*) as total_registros,
    COUNT(DISTINCT nombre_chofer) as choferes_diferentes,
    MIN(fecha_hora) as primer_registro,
    MAX(fecha_hora) as ultimo_registro
FROM public.chofer_registros;
