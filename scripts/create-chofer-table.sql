-- Crear tabla para registros de choferes
CREATE TABLE IF NOT EXISTS chofer_registros (
    id SERIAL PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_chofer_registros_nombre ON chofer_registros(nombre_chofer);
CREATE INDEX IF NOT EXISTS idx_chofer_registros_tipo ON chofer_registros(tipo);
CREATE INDEX IF NOT EXISTS idx_chofer_registros_fecha ON chofer_registros(fecha_hora);

-- Verificar que la tabla existe y tiene la estructura correcta
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'chofer_registros' 
ORDER BY ordinal_position;
