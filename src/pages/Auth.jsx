import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } }
        })
        if (error) throw error
        setSuccess('Cuenta creada. Revisa tu correo para confirmar tu cuenta.')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
        : err.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'rgba(200,184,138,0.06)',
    border: '1px solid rgba(200,184,138,0.15)', borderRadius: 10, color: '#E8E0D0',
    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    marginBottom: 16
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0F1923', padding: 20
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#152028',
        border: '1px solid rgba(200,184,138,0.12)', borderRadius: 20, padding: 36
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C8B88A" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 3v18"/><path d="M5 8l7-5 7 5"/>
            <path d="M3 13a4 4 0 0 0 4 4"/><path d="M17 13a4 4 0 0 1 4 4"/>
            <circle cx="5" cy="13" r="2"/><circle cx="19" cy="13" r="2"/>
          </svg>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#C8B88A', marginTop: 12 }}>
            Despacho Legal
          </div>
          <div style={{ fontSize: 12, color: 'rgba(200,184,138,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
            Sistema de Gestión
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(200,184,138,0.5)', marginBottom: 6 }}>
                Nombre completo
              </label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre" required style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(200,184,138,0.5)', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" required style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(200,184,138,0.5)', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" required minLength={6} style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF9A9A' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(46,125,50,0.1)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#81C784' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px 20px', background: '#C8B88A', color: '#0F1923',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: 0.5, opacity: loading ? 0.7 : 1,
            marginBottom: 16
          }}>
            {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }} style={{
            background: 'none', border: 'none', color: '#C8B88A', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline',
            opacity: 0.7
          }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
