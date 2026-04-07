-- ============================================
-- MIGRACIÓN 002: Mejoras de seguridad
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ─── 1. Extensión pgcrypto para encriptación ─────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 2. Columna equipo_id donde falta ────────────────────────────────────────
-- El código ya inserta equipo_id en cada registro, pero las tablas base
-- del schema.sql no tienen esta columna definida.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS equipo_id UUID;
ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS equipo_id UUID;
ALTER TABLE actuaciones ADD COLUMN IF NOT EXISTS equipo_id UUID;
ALTER TABLE documentos_cliente ADD COLUMN IF NOT EXISTS equipo_id UUID;
ALTER TABLE cobros ADD COLUMN IF NOT EXISTS equipo_id UUID;
ALTER TABLE actividad ADD COLUMN IF NOT EXISTS equipo_id UUID;

-- Índices para equipo_id
CREATE INDEX IF NOT EXISTS idx_clientes_equipo ON clientes(equipo_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_equipo ON expedientes(equipo_id);
CREATE INDEX IF NOT EXISTS idx_actuaciones_equipo ON actuaciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_equipo ON documentos_cliente(equipo_id);
CREATE INDEX IF NOT EXISTS idx_cobros_equipo ON cobros(equipo_id);
CREATE INDEX IF NOT EXISTS idx_actividad_equipo ON actividad(equipo_id);

-- ─── 3. Columna visible_portal en cobros ─────────────────────────────────────
ALTER TABLE cobros ADD COLUMN IF NOT EXISTS visible_portal BOOLEAN DEFAULT false;

-- ─── 4. RLS para equipo_miembros ──────────────────────────────────────────────
ALTER TABLE equipo_miembros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own team membership" ON equipo_miembros;
CREATE POLICY "Users can view own team membership"
  ON equipo_miembros FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own team membership" ON equipo_miembros;
CREATE POLICY "Users can manage own team membership"
  ON equipo_miembros FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 5. RLS para portal_clientes ─────────────────────────────────────────────
ALTER TABLE portal_clientes ENABLE ROW LEVEL SECURITY;

-- Portal users can see their own link
DROP POLICY IF EXISTS "Portal users can view own link" ON portal_clientes;
CREATE POLICY "Portal users can view own link"
  ON portal_clientes FOR SELECT
  USING (auth.uid() = user_id);

-- Team admins can manage portal clients in their team
DROP POLICY IF EXISTS "Team admins can manage portal clients" ON portal_clientes;
CREATE POLICY "Team admins can manage portal clients"
  ON portal_clientes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid()
        AND em.equipo_id = portal_clientes.equipo_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid()
        AND em.equipo_id = portal_clientes.equipo_id
    )
  );

-- ─── 6. Actualizar RLS de tablas principales para soportar equipo ────────────

-- === CLIENTES ===
DROP POLICY IF EXISTS "Users can view own clientes" ON clientes;
CREATE POLICY "Users can view team clientes" ON clientes
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = clientes.equipo_id
    )
    OR EXISTS (
      SELECT 1 FROM portal_clientes pc
      WHERE pc.user_id = auth.uid() AND pc.activo = true AND pc.cliente_id = clientes.id
    )
  );

DROP POLICY IF EXISTS "Users can insert own clientes" ON clientes;
CREATE POLICY "Users can insert team clientes" ON clientes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = clientes.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can update own clientes" ON clientes;
CREATE POLICY "Users can update team clientes" ON clientes
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = clientes.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own clientes" ON clientes;
CREATE POLICY "Users can delete team clientes" ON clientes
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = clientes.equipo_id
    )
  );

-- === EXPEDIENTES ===
DROP POLICY IF EXISTS "Users can view own expedientes" ON expedientes;
CREATE POLICY "Users can view team expedientes" ON expedientes
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = expedientes.equipo_id
    )
    OR EXISTS (
      SELECT 1 FROM portal_clientes pc
      WHERE pc.user_id = auth.uid() AND pc.activo = true AND pc.cliente_id = expedientes.cliente_id
    )
  );

DROP POLICY IF EXISTS "Users can insert own expedientes" ON expedientes;
CREATE POLICY "Users can insert team expedientes" ON expedientes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = expedientes.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can update own expedientes" ON expedientes;
CREATE POLICY "Users can update team expedientes" ON expedientes
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = expedientes.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own expedientes" ON expedientes;
CREATE POLICY "Users can delete team expedientes" ON expedientes
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = expedientes.equipo_id
    )
  );

-- === ACTUACIONES ===
DROP POLICY IF EXISTS "Users can view own actuaciones" ON actuaciones;
CREATE POLICY "Users can view team actuaciones" ON actuaciones
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actuaciones.equipo_id
    )
    OR EXISTS (
      SELECT 1 FROM portal_clientes pc
      JOIN expedientes exp ON exp.cliente_id = pc.cliente_id
      WHERE pc.user_id = auth.uid() AND pc.activo = true
        AND exp.id = actuaciones.expediente_id
        AND actuaciones.visible_portal = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own actuaciones" ON actuaciones;
CREATE POLICY "Users can insert team actuaciones" ON actuaciones
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actuaciones.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can update own actuaciones" ON actuaciones;
CREATE POLICY "Users can update team actuaciones" ON actuaciones
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actuaciones.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own actuaciones" ON actuaciones;
CREATE POLICY "Users can delete team actuaciones" ON actuaciones
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actuaciones.equipo_id
    )
  );

-- === DOCUMENTOS_CLIENTE ===
DROP POLICY IF EXISTS "Users can view own documentos" ON documentos_cliente;
CREATE POLICY "Users can view team documentos" ON documentos_cliente
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = documentos_cliente.equipo_id
    )
    OR EXISTS (
      SELECT 1 FROM portal_clientes pc
      WHERE pc.user_id = auth.uid() AND pc.activo = true
        AND pc.cliente_id = documentos_cliente.cliente_id
        AND documentos_cliente.visible_portal = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own documentos" ON documentos_cliente;
CREATE POLICY "Users can insert team documentos" ON documentos_cliente
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = documentos_cliente.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can update own documentos" ON documentos_cliente;
CREATE POLICY "Users can update team documentos" ON documentos_cliente
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = documentos_cliente.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own documentos" ON documentos_cliente;
CREATE POLICY "Users can delete team documentos" ON documentos_cliente
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = documentos_cliente.equipo_id
    )
  );

-- === COBROS ===
DROP POLICY IF EXISTS "Users can view own cobros" ON cobros;
CREATE POLICY "Users can view team cobros" ON cobros
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = cobros.equipo_id
    )
    OR EXISTS (
      SELECT 1 FROM portal_clientes pc
      WHERE pc.user_id = auth.uid() AND pc.activo = true
        AND pc.cliente_id = cobros.cliente_id
        AND cobros.visible_portal = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own cobros" ON cobros;
CREATE POLICY "Users can insert team cobros" ON cobros
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = cobros.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can update own cobros" ON cobros;
CREATE POLICY "Users can update team cobros" ON cobros
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = cobros.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own cobros" ON cobros;
CREATE POLICY "Users can delete team cobros" ON cobros
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = cobros.equipo_id
    )
  );

-- === ACTIVIDAD ===
DROP POLICY IF EXISTS "Users can view own actividad" ON actividad;
CREATE POLICY "Users can view team actividad" ON actividad
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actividad.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can insert own actividad" ON actividad;
CREATE POLICY "Users can insert team actividad" ON actividad
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actividad.equipo_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own actividad" ON actividad;
CREATE POLICY "Users can delete team actividad" ON actividad
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM equipo_miembros em
      WHERE em.user_id = auth.uid() AND em.equipo_id = actividad.equipo_id
    )
  );

-- ─── 7. Storage bucket con políticas de acceso ───────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own docs" ON storage.objects;
CREATE POLICY "Users can upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own docs" ON storage.objects;
CREATE POLICY "Users can view own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own docs" ON storage.objects;
CREATE POLICY "Users can delete own docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
