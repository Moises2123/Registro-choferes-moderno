-- Crear tabla para registros de choferes
CREATE TABLE IF NOT EXISTS public.chofer_registros (
    id BIGSERIAL PRIMARY KEY,
    nombre_chofer VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Entrada', 'Salida')),
    destino TEXT DEFAULT NULL,
    diligencia TEXT DEFAULT NULL,
    sustento TEXT DEFAULT NULL,
    solicitud TEXT DEFAULT NULL,
    responsable VARCHAR(255) DEFAULT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_chofer_registros_nombre ON public.chofer_registros(nombre_chofer);
CREATE INDEX IF NOT EXISTS idx_chofer_registros_tipo ON public.chofer_registros(tipo);
CREATE INDEX IF NOT EXISTS idx_chofer_registros_fecha ON public.chofer_registros(fecha_hora);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.chofer_registros ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (para desarrollo)
CREATE POLICY "Enable all operations for chofer_registros" ON public.chofer_registros
    FOR ALL USING (true) WITH CHECK (true);

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chofer_registros'
ORDER BY ordinal_position;
