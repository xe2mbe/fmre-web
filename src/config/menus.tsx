import {
  HomeOutlined, TeamOutlined, IdcardOutlined,
  FileTextOutlined, SettingOutlined, UserOutlined,
  ReadOutlined, EditOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { Rol } from '../auth/AuthContext'

export interface MenuDef {
  key:       string
  label:     string
  icon?:     ReactNode
  path?:     string
  roles:     Rol[]
  children?: MenuDef[]
}

export const MENUS: MenuDef[] = [
  // ── Todos ────────────────────────────────────────────────────────────────
  {
    key: 'inicio', label: 'Inicio',
    icon: <HomeOutlined />, path: '/app/inicio', roles: [],
  },
  {
    key: 'mi-perfil', label: 'Mi Perfil',
    icon: <UserOutlined />, path: '/app/perfil', roles: [],
  },

  // ── Administrador ─────────────────────────────────────────────────────────
  {
    key: 'boletines', label: 'Boletines',
    icon: <ReadOutlined />, roles: ['administrador'],
    children: [
      { key: 'boletin-editor',     label: 'Editor',     icon: <EditOutlined />,      path: '/app/boletines/editor',     roles: ['administrador'] },
      { key: 'boletin-plantillas', label: 'Plantillas', icon: <AppstoreOutlined />, path: '/app/boletines/plantillas', roles: ['administrador'] },
    ],
  },
  {
    key: 'socios', label: 'Socios',
    icon: <TeamOutlined />, path: '/app/socios', roles: ['administrador'],
  },
  {
    key: 'membresias', label: 'Membresías',
    icon: <IdcardOutlined />, path: '/app/membresias', roles: ['administrador'],
  },
  {
    key: 'reportes', label: 'Reportes',
    icon: <FileTextOutlined />, path: '/app/reportes', roles: ['administrador'],
  },
  {
    key: 'configuracion', label: 'Configuración',
    icon: <SettingOutlined />, path: '/app/configuracion', roles: ['administrador'],
  },
]

export function menusPorRol(rol: Rol): MenuDef[] {
  return MENUS
    .filter(m => m.roles.length === 0 || m.roles.includes(rol))
    .map(m => ({
      ...m,
      children: m.children?.filter(c => c.roles.length === 0 || c.roles.includes(rol)),
    }))
}
