import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'
import { menusPorRol, type MenuDef } from '../config/menus'
import type { ItemType } from 'antd/es/menu/interface'

const { Sider, Header, Content } = Layout
const FMRE_DARK = '#0D2E5F'
const FMRE_BLUE = '#1A569E'

export default function AppLayout() {
  const { usuario, logout } = useAuth()
  const navigate            = useNavigate()
  const location            = useLocation()
  const [collapsed, set]    = useState(false)

  if (!usuario) return null

  const menus = menusPorRol(usuario.rol)

  const activeKey = (() => {
    for (const m of menus) {
      if (m.children) {
        const child = m.children.find(c => c.path && location.pathname.startsWith(c.path))
        if (child) return child.key
      }
      if (m.path && location.pathname.startsWith(m.path)) return m.key
    }
    return ''
  })()

  const openKeys = menus
    .filter(m => m.children?.some(c => c.path && location.pathname.startsWith(c.path)))
    .map(m => m.key)

  function buildItems(items: MenuDef[]): ItemType[] {
    return items.map(m => ({
      key:   m.key,
      icon:  m.icon,
      label: m.label,
      ...(m.children
        ? { children: buildItems(m.children) }
        : { onClick: () => m.path && navigate(m.path) }
      ),
    })) as ItemType[]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsed={collapsed} width={220}
        style={{ background: FMRE_DARK, position: 'fixed', height: '100vh', left: 0, top: 0 }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? '16px 8px' : '16px 20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <img src="/fmre.webp" alt="FMRE" style={{ height: 36, objectFit: 'contain' }} />
          {!collapsed && (
            <div style={{ color: '#8ab4e0', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
              PORTAL DE MIEMBROS
            </div>
          )}
        </div>

        {/* Menús filtrados por rol */}
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[activeKey]}
          defaultOpenKeys={openKeys}
          style={{ background: FMRE_DARK, marginTop: 8, border: 'none' }}
          items={buildItems(menus)}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin .2s' }}>
        <Header style={{
          background: 'white', padding: '0 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Button type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => set(!collapsed)} style={{ fontSize: 16 }} />

          <div style={{ flex: 1 }} />

          <Dropdown placement="bottomRight" menu={{ items: [
            {
              key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión', danger: true,
              onClick: () => { logout(); navigate('/') },
            },
          ]}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Avatar style={{ background: FMRE_BLUE }} icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: FMRE_DARK }}>
                  {usuario.nombre}
                </div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>
                  {usuario.rol}
                  {usuario.indicativo && ` · ${usuario.indicativo}`}
                </div>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
