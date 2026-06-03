import { Card, Tag } from 'antd'
import { WifiOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'

const FMRE_DARK = '#0D2E5F'
const FMRE_BLUE = '#1A569E'

export default function DashboardPage() {
  const { usuario } = useAuth()
  if (!usuario) return null

  const esAdmin = usuario.rol === 'administrador'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: FMRE_DARK, fontSize: 24 }}>
          Bienvenido, {usuario.nombre}
        </h2>
        <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag color={esAdmin ? 'volcano' : 'blue'} style={{ textTransform: 'capitalize' }}>
            {usuario.rol}
          </Tag>
          {usuario.indicativo && (
            <Tag icon={<WifiOutlined />} color="geekblue">{usuario.indicativo}</Tag>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
        <Card style={{ borderRadius: 12, borderTop: `4px solid ${FMRE_BLUE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserOutlined style={{ fontSize: 28, color: FMRE_BLUE }} />
            <div>
              <div style={{ fontSize: 12, color: '#888' }}>Correo</div>
              <div style={{ fontWeight: 600, color: FMRE_DARK }}>{usuario.email}</div>
            </div>
          </div>
        </Card>

        {usuario.indicativo && (
          <Card style={{ borderRadius: 12, borderTop: `4px solid #1677ff` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <WifiOutlined style={{ fontSize: 28, color: '#1677ff' }} />
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>Indicativo</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: FMRE_DARK }}>
                  {usuario.indicativo}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
