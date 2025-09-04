-- Script para resetear manualmente la contraseña del administrador
-- IMPORTANTE: Este script debe ejecutarse directamente en Supabase Dashboard

-- Opción 1: Resetear contraseña para tu email específico
-- Cambia la contraseña del usuario timberling45@gmail.com a 'admin123456'
UPDATE auth.users 
SET encrypted_password = crypt('admin123456', gen_salt('bf'))
WHERE email = 'timberling45@gmail.com';

-- Verificar que el usuario existe y fue actualizado
SELECT 
  email,
  created_at,
  email_confirmed_at,
  'Contraseña actualizada a: admin123456' as mensaje
FROM auth.users 
WHERE email = 'timberling45@gmail.com';

-- Si el usuario no existe, mostrar todos los usuarios para identificar el correcto
SELECT 
  email,
  created_at,
  'Usuario encontrado' as estado
FROM auth.users 
ORDER BY created_at ASC;

-- Asegurar que el usuario tenga perfil de administrador
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'Administrador Principal',
  'admin'
FROM auth.users u
WHERE u.email = 'timberling45@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.id = u.id
);

-- Actualizar el rol si ya existe el perfil
UPDATE user_profiles 
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'timberling45@gmail.com');

-- Verificación final
SELECT 
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  'Listo para usar con contraseña: admin123456' as instrucciones
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'timberling45@gmail.com';
