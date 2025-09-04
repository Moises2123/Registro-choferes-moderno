-- Script completo para configurar timberling45@gmail.com como administrador
-- Este script maneja tanto si el usuario ya existe como si no existe

-- Primero, verificar si el usuario ya existe
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Verificar si el usuario existe en auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'timberling45@gmail.com') INTO user_exists;
    
    IF user_exists THEN
        -- El usuario ya existe, obtener su ID
        SELECT id INTO user_id FROM auth.users WHERE email = 'timberling45@gmail.com';
        
        -- Crear o actualizar el perfil como admin
        INSERT INTO public.user_profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (
            user_id,
            'timberling45@gmail.com',
            'Administrador Principal',
            'admin',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            updated_at = NOW();
            
        RAISE NOTICE 'Usuario existente configurado como administrador';
    ELSE
        RAISE NOTICE 'El usuario no existe aún. Se configurará como admin cuando se registre.';
    END IF;
END $$;

-- Actualizar la función handle_new_user para hacer admin específicamente a este email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Contar cuántos usuarios ya existen
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    
    -- Insertar el nuevo perfil
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN NEW.email = 'timberling45@gmail.com' THEN 'admin'  -- Este email específico siempre será admin
            WHEN user_count = 0 THEN 'admin'  -- El primer usuario también será admin
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar el resultado
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE email = 'timberling45@gmail.com' AND role = 'admin')
        THEN 'timberling45@gmail.com ya está configurado como administrador'
        ELSE 'timberling45@gmail.com se configurará como administrador cuando se registre'
    END as status;

-- Mostrar todos los administradores actuales
SELECT 
    'Administradores actuales:' as info,
    email, 
    full_name, 
    role, 
    created_at
FROM public.user_profiles 
WHERE role = 'admin'
ORDER BY created_at;
