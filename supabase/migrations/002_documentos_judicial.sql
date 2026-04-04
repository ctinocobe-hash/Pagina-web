-- Migración: tabla documentos_judicial para almacenar documentos del portal de Servicios Virtuales
-- (acuerdos, promociones, contestaciones, sentencias, etc.)
-- Ejecutar en Supabase SQL Editor

-- ─── Nueva tabla: documentos_judicial ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_judicial (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Documento', -- 'Acuerdo', 'Promoción', 'Contestación', 'Sentencia', 'Notificación', 'Documento'
  descripcion TEXT,
  pdf_url TEXT,             -- URL del PDF en el portal judicial
  pdf_links JSONB DEFAULT '[]', -- Array de URLs de PDFs asociados
  storage_path TEXT,        -- Ruta en Supabase Storage (documentos-judicial bucket)
  origen TEXT DEFAULT 'portal_servicios_virtuales',
  visible_portal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_docjudicial_user ON documentos_judicial(user_id);
CREATE INDEX IF NOT EXISTS idx_docjudicial_expediente ON documentos_judicial(expediente_id);
CREATE INDEX IF NOT EXISTS idx_docjudicial_tipo ON documentos_judicial(tipo);
CREATE INDEX IF NOT EXISTS idx_docjudicial_fecha ON documentos_judicial(fecha);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE documentos_judicial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documentos_judicial" ON documentos_judicial
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documentos_judicial" ON documentos_judicial
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documentos_judicial" ON documentos_judicial
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documentos_judicial" ON documentos_judicial
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Columnas adicionales en configuracion_portal ────────────────────────────
ALTER TABLE configuracion_portal
  ADD COLUMN IF NOT EXISTS ultima_consulta_expedientes TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultimo_resultado_expedientes JSONB;

-- ─── Storage bucket para PDFs judiciales ─────────────────────────────────────
-- (El bucket se crea automáticamente desde sync-actions.js si no existe)
-- Para crearlo manualmente:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-judicial', 'documentos-judicial', false);
-- CREATE POLICY "Users can view own judicial docs" ON storage.objects FOR SELECT
--   USING (bucket_id = 'documentos-judicial' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Service role can upload judicial docs" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documentos-judicial');
