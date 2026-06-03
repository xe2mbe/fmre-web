import { useState } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const FMRE_BLUE = '#1A569E'
const FMRE_DARK = '#0D2E5F'

export default function LoginPage() {
  const { login }              = useAuth()
  const navigate               = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [error, setError]      = useState<string | null>(null)

  const onFinish = async (values: { email: string; password: string }) => {
    setCargando(true)
    setError(null)
    try {
      await login(values.email, values.password)
      navigate('/app/inicio', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: FMRE_DARK,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/fmre.webp" alt="FMRE" style={{ height: 56, marginBottom: 12 }} />
          <h2 style={{ color: FMRE_DARK, margin: 0, fontSize: 20 }}>Portal de Miembros</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Federación Mexicana de Radioexperimentadores, A.C.
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon closable
            onClose={() => setError(null)} style={{ marginBottom: 20 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email"
            rules={[{ required: true, message: 'Ingresa tu correo' }, { type: 'email', message: 'Correo inválido' }]}>
            <Input size="large" prefix={<UserOutlined style={{ color: '#bbb' }} />}
              placeholder="Correo electrónico" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
            <Input.Password size="large" prefix={<LockOutlined style={{ color: '#bbb' }} />}
              placeholder="Contraseña" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" size="large" block
              loading={cargando}
              style={{ background: FMRE_BLUE, borderColor: FMRE_BLUE }}>
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="link" onClick={() => navigate('/')}
            style={{ color: '#aaa', fontSize: 12 }}>
            ← Volver a la página principal
          </Button>
        </div>
      </div>
    </div>
  )
}
