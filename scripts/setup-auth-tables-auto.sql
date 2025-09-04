-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los admins puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para que los admins puedan insertar nuevos usuarios
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Función para crear perfil automáticamente cuando se registra un usuario
-- EL PRIMER USUARIO SERÁ AUTOMÁTICAMENTE ADMINISTRADOR
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Contar cuántos usuarios ya existen
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    
    -- Si es el primer usuario, hacerlo administrador automáticamente
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN user_count = 0 THEN 'admin'  -- Primer usuario = admin automático
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Actualizar políticas de chofer_registros
-- PERMITIR QUE TODOS LOS USUARIOS AUTENTICADOS PUEDAN HACER TODO
DROP POLICY IF EXISTS "Enable all operations for chofer_registros" ON public.chofer_registros;
DROP POLICY IF EXISTS "Authenticated users can view chofer_registros" ON public.chofer_registros;
DROP POLICY IF EXISTS "Authenticated users can insert chofer_registros" ON public.chofer_registros;
DROP POLICY IF EXISTS "Authenticated users can update chofer_registros" ON public.chofer_registros;
DROP POLICY IF EXISTS "Admins can delete chofer_registros" ON public.chofer_registros;

-- Política única: todos los usuarios autenticados pueden hacer todo
CREATE POLICY "Authenticated users can do everything on chofer_registros" ON public.chofer_registros
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Crear tabla de logs de actividad (para auditoría)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs
CREATE POLICY "Admins can view activity_logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Todos los usuarios autenticados pueden insertar logs
CREATE POLICY "Authenticated users can insert activity_logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Función para obtener información del primer admin
CREATE OR REPLACE FUNCTION public.get_first_admin_info()
RETURNS TABLE(email TEXT, full_name TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT up.email, up.full_name, up.created_at
    FROM public.user_profiles up
    WHERE up.role = 'admin'
    ORDER BY up.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mostrar información del sistema
SELECT 
    'Sistema configurado correctamente' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin') 
        THEN 'Ya existe un administrador'
        ELSE 'El próximo usuario registrado será administrador automáticamente'
    END as admin_status;
