import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BG = "#0D0D0D", SURFACE = "#1A1A1A", GOLD = "#B8963E", TEXT = "#F5F0E8", MUTED = "#A09882"
const FT = "'Cormorant Garamond', serif", FB = "'Source Serif 4', serif"

const LogoIcon = ({ size = 48, color = GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 96 76" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
    <line x1="48" y1="0" x2="48" y2="64" strokeWidth="3.2"/><line x1="12" y1="10" x2="84" y2="10" strokeWidth="3.2"/>
    <circle cx="12" cy="10" r="4" strokeWidth="2.8" fill={color}/><line x1="12" y1="14" x2="12" y2="32" strokeWidth="2.6"/>
    <line x1="0" y1="32" x2="24" y2="32" strokeWidth="3.2"/><circle cx="84" cy="10" r="4" strokeWidth="2.8" fill={color}/>
    <line x1="84" y1="14" x2="84" y2="32" strokeWidth="2.6"/><line x1="72" y1="32" x2="96" y2="32" strokeWidth="3.2"/>
    <line x1="36" y1="64" x2="60" y2="64" strokeWidth="3.2"/>
  </svg>
)

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
        if (error) throw error
        setSuccess('Cuenta creada. Revisa tu correo para confirmar.')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas.' : err.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'rgba(184,150,62,0.05)',
    border: '1px solid rgba(184,150,62,0.15)', borderRadius: 10, color: TEXT,
    fontSize: 14, fontFamily: FB, outline: 'none', boxSizing: 'border-box', marginBottom: 16
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, background: SURFACE, border: '1px solid rgba(184,150,62,0.1)', borderRadius: 20, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LogoIcon size={48} />
          <div style={{ height: 6 }} />
          <div style={{ fontFamily: FT, fontSize: 28, fontWeight: 600, color: TEXT, letterSpacing: 8 }}>TINOCO</div>
          <div style={{ width: 50, height: 1, background: GOLD, margin: '6px auto' }} />
          <div style={{ fontFamily: FB, fontSize: 12, color: MUTED, letterSpacing: 3 }}>firma legal</div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: MUTED, marginBottom: 6 }}>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required style={inputStyle} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: MUTED, marginBottom: 6 }}>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: MUTED, marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} style={inputStyle} />
          </div>

          {error && <div style={{ background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF9A9A' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#81C784' }}>{success}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px 20px', background: GOLD, color: BG,
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: FB, letterSpacing: 0.5, opacity: loading ? 0.7 : 1, marginBottom: 16
          }}>
            {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }} style={{
            background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 12, fontFamily: FB, opacity: 0.7
          }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
