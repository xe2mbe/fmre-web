import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import FMREPage     from './FMREPage'
import LoginPage    from './pages/LoginPage'
import AppLayout    from './layouts/AppLayout'
import DashboardPage   from './pages/DashboardPage'
import BoletinesPage   from './pages/boletines/BoletinesPage'
import PlantillasPage  from './pages/boletines/PlantillasPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/"      element={<FMREPage />} />
      <Route path="/login" element={usuario ? <Navigate to="/app/inicio" replace /> : <LoginPage />} />

      <Route path="/app" element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/inicio" replace />} />
        <Route path="inicio"               element={<DashboardPage />} />
        <Route path="boletines/editor"    element={<BoletinesPage />} />
        <Route path="boletines/plantillas" element={<PlantillasPage />} />
        <Route path="boletines"           element={<Navigate to="/app/boletines/editor" replace />} />
        {/* Aquí se irán agregando las rutas por módulo */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
