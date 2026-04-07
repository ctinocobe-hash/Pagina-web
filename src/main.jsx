import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase, db } from './lib/supabase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Portal from './pages/portal'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos de inactividad

function App() {
  const [session, setSession] = useState(null)
  const [userType, setUserType] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) detectUserType()
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) { setLoading(true); detectUserType() }
      else { setUserType(null); setUserInfo(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cierre de sesión por inactividad
  useEffect(() => {
    if (!session) return
    let timer = setTimeout(() => supabase.auth.signOut(), IDLE_TIMEOUT_MS)
    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(() => supabase.auth.signOut(), IDLE_TIMEOUT_MS)
    }
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(ev => window.addEventListener(ev, resetTimer))
    return () => {
      clearTimeout(timer)
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [session])

  async function detectUserType() {
    try {
      const info = await db.getUserType()
      setUserType(info.type)
      setUserInfo(info)
    } catch (err) { console.error('Error detecting user type:', err); setUserType('unknown') }
    setLoading(false)
  }

  if (loading) {
    const dark = localStorage.getItem('tema') !== 'claro'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: dark ? '#0D0D0D' : '#F2F1ED' }}>
        <svg width="56" height="56" viewBox="0 0 96 76" fill="none" stroke="#B8963E" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
          <line x1="48" y1="0" x2="48" y2="64" strokeWidth="3.2"/><line x1="12" y1="10" x2="84" y2="10" strokeWidth="3.2"/>
          <circle cx="12" cy="10" r="4" strokeWidth="2.8" fill="#B8963E"/><line x1="12" y1="14" x2="12" y2="32" strokeWidth="2.6"/>
          <line x1="0" y1="32" x2="24" y2="32" strokeWidth="3.2"/><circle cx="84" cy="10" r="4" strokeWidth="2.8" fill="#B8963E"/>
          <line x1="84" y1="14" x2="84" y2="32" strokeWidth="2.6"/><line x1="72" y1="32" x2="96" y2="32" strokeWidth="3.2"/>
          <line x1="36" y1="64" x2="60" y2="64" strokeWidth="3.2"/>
        </svg>
      </div>
    )
  }

  if (!session) return <Auth />
  if (userType === 'admin') return <Dashboard session={session} userInfo={userInfo} />
  if (userType === 'portal') return <Portal session={session} userInfo={userInfo} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D0D0D', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 18, color: '#F5F0E8', fontWeight: 700, marginBottom: 12 }}>Cuenta sin acceso</div>
        <div style={{ fontSize: 14, color: '#A09882', lineHeight: 1.6, marginBottom: 24 }}>
          Tu cuenta no tiene permisos asignados. Contacta al administrador del despacho para obtener acceso.
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{
          padding: '10px 24px', background: '#B8963E', color: '#0D0D0D', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
        }}>Cerrar sesión</button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
