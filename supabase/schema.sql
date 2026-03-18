-- ============================================
-- DESPACHO LEGAL - Esquema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: clientes
-- ============================================
CREATE TABLE clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  rfc TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: expedientes
-- ============================================
CREATE TABLE expedientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  tipo TEXT NOT NULL,
  materia TEXT NOT NULL DEFAULT 'Civil',
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  juzgado TEXT,
  estado TEXT NOT NULL DEFAULT 'En trámite',
  urgente BOOLEAN DEFAULT false,
  fecha_inicio DATE,
  proximo_plazo DATE,
  notas TEXT,
  -- Relación con expediente padre (para amparos, apelaciones, etc.)
  expediente_padre_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
  relacion TEXT, -- 'Apelación', 'Amparo directo', 'Amparo indirecto', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: actuaciones (lo actuado en juicio)
-- ============================================
CREATE TABLE actuaciones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL, -- 'Presentación', 'Acuerdo', 'Auto', 'Sentencia', etc.
  descripcion TEXT NOT NULL,
  documento TEXT, -- referencia al documento
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: documentos_cliente
-- ============================================
CREATE TABLE documentos_cliente (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'Contrato', 'Recibo de pago', 'Poder notarial', etc.
  fecha DATE,
  notas TEXT,
  archivo_url TEXT, -- URL del archivo en Supabase Storage (opcional)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: cobros
-- ============================================
CREATE TABLE cobros (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Pagado', 'Vencido'
  fecha_emision DATE,
  fecha_vencimiento DATE,
  fecha_pago DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: actividad (log de actividad reciente)
-- ============================================
CREATE TABLE actividad (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'general', -- 'expediente', 'cliente', 'cobro', 'general'
  referencia_id UUID, -- ID del registro relacionado
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES para rendimiento
-- ============================================
CREATE INDEX idx_expedientes_user ON expedientes(user_id);
CREATE INDEX idx_expedientes_cliente ON expedientes(cliente_id);
CREATE INDEX idx_expedientes_padre ON expedientes(expediente_padre_id);
CREATE INDEX idx_expedientes_plazo ON expedientes(proximo_plazo);
CREATE INDEX idx_actuaciones_expediente ON actuaciones(expediente_id);
CREATE INDEX idx_documentos_cliente ON documentos_cliente(cliente_id);
CREATE INDEX idx_cobros_cliente ON cobros(cliente_id);
CREATE INDEX idx_cobros_estado ON cobros(estado);
CREATE INDEX idx_actividad_user ON actividad(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve sus propios datos
-- ============================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actuaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Users can view own clientes" ON clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clientes" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clientes" ON clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clientes" ON clientes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para expedientes
CREATE POLICY "Users can view own expedientes" ON expedientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expedientes" ON expedientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expedientes" ON expedientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expedientes" ON expedientes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para actuaciones
CREATE POLICY "Users can view own actuaciones" ON actuaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actuaciones" ON actuaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actuaciones" ON actuaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actuaciones" ON actuaciones FOR DELETE USING (auth.uid() = user_id);

-- Políticas para documentos_cliente
CREATE POLICY "Users can view own documentos" ON documentos_cliente FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documentos" ON documentos_cliente FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documentos" ON documentos_cliente FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documentos" ON documentos_cliente FOR DELETE USING (auth.uid() = user_id);

-- Políticas para cobros
CREATE POLICY "Users can view own cobros" ON cobros FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cobros" ON cobros FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cobros" ON cobros FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cobros" ON cobros FOR DELETE USING (auth.uid() = user_id);

-- Políticas para actividad
CREATE POLICY "Users can view own actividad" ON actividad FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actividad" ON actividad FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own actividad" ON actividad FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expedientes_updated_at BEFORE UPDATE ON expedientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cobros_updated_at BEFORE UPDATE ON cobros FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE: Bucket para archivos de clientes
-- (ejecutar después de crear las tablas)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);
-- CREATE POLICY "Users can upload own docs" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view own docs" ON storage.objects FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own docs" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
