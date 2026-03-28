-- Migración: columnas para integración del portal judicial
-- Ejecutar en Supabase SQL Editor si no existen aún

-- ─── actuaciones: columnas para portal judicial ───────────────────────────────
ALTER TABLE actuaciones
  ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'manual',           -- 'manual' | 'portal_judicial'
  ADD COLUMN IF NOT EXISTS visible_portal BOOLEAN DEFAULT false;   -- visible para el cliente en el portal

-- ─── documentos_cliente: visibilidad en portal ────────────────────────────────
ALTER TABLE documentos_cliente
  ADD COLUMN IF NOT EXISTS visible_portal BOOLEAN DEFAULT false;

-- ─── configuracion_portal: portal judicial por usuario ───────────────────────
CREATE TABLE IF NOT EXISTS configuracion_portal (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  equipo_id UUID,
  portal_url TEXT,
  usuario TEXT,
  password TEXT,
  ultimo_sync TIMESTAMPTZ,
  ultimo_resultado JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE configuracion_portal ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own portal config" ON configuracion_portal
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Índice para búsqueda por origen en actuaciones
CREATE INDEX IF NOT EXISTS idx_actuaciones_origen ON actuaciones(origen);
