import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Rol = 'administrador' | 'radioaficionado'

export interface Usuario {
  email:      string
  nombre:     string
  rol:        Rol
  indicativo: string | null
}

interface AuthCtx {
  usuario:  Usuario | null
  token:    string | null
  cargando: boolean
  login:    (email: string, password: string) => Promise<void>
  logout:   () => void
}

const Ctx = createContext<AuthCtx | null>(null)

const API          = (import.meta.env.VITE_EQMS_URL as string) || ''
const STORAGE_KEY  = 'fmre_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario,  setUsuario]  = useState<Usuario | null>(null)
  const [token,    setToken]    = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setUsuario(saved.usuario)
        setToken(saved.token)
      }
    } catch { /* storage corrupto */ }
    setCargando(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res  = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'Credenciales incorrectas')

    setUsuario(data.usuario)
    setToken(data.token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ usuario: data.usuario, token: data.token }))
  }

  const logout = () => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <Ctx.Provider value={{ usuario, token, cargando, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
