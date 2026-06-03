import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space,
  Popconfirm, Tooltip, Typography, Empty, Divider, message,
} from 'antd'
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const API      = (import.meta.env.VITE_EQMS_URL as string) || ''
const FMRE_DARK = '#0D2E5F'
const FMRE_BLUE = '#1A569E'

const FUENTES = [
  { label: 'Arial',           value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia',         value: 'Georgia, serif' },
  { label: 'Courier New',     value: '"Courier New", monospace' },
  { label: 'Verdana',         value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS',    value: '"Trebuchet MS", sans-serif' },
  { label: 'Palatino',        value: '"Palatino Linotype", serif' },
  { label: 'Tahoma',          value: 'Tahoma, sans-serif' },
]

const TIPOS: { label: string; value: string; color: string }[] = [
  { label: 'Estática',  value: 'estatica',  color: 'blue'   },
  { label: 'Dinámica',  value: 'dinamica',  color: 'green'  },
  { label: 'Temporal',  value: 'temporal',  color: 'orange' },
]

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Plantilla {
  id: number; nombre: string; descripcion: string
  total_secciones: number; created_at: string
}

interface Seccion {
  id: number; plantilla_id: number; nombre: string
  tipo: string; fuente: string; contenido: string; orden: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tipoTag(tipo: string) {
  const t = TIPOS.find(x => x.value === tipo)
  return <Tag color={t?.color}>{t?.label ?? tipo}</Tag>
}

// ── Modal Plantilla ───────────────────────────────────────────────────────────

function PlantillaModal({ open, plantilla, onOk, onCancel }: {
  open: boolean; plantilla: Plantilla | null
  onOk: (values: { nombre: string; descripcion: string }) => Promise<void>
  onCancel: () => void
}) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) form.setFieldsValue(plantilla ?? { nombre: '', descripcion: '' })
  }, [open, plantilla, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onOk(values)
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} title={plantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}
      onOk={handleOk} onCancel={onCancel} okText="Guardar" confirmLoading={loading}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
          <Input placeholder="Ej. Plantilla Estándar" />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={2} placeholder="Descripción opcional" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── Modal Sección ─────────────────────────────────────────────────────────────

function SeccionModal({ open, seccion, onOk, onCancel }: {
  open: boolean; seccion: Seccion | null
  onOk: (values: Partial<Seccion>) => Promise<void>
  onCancel: () => void
}) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const fuente = Form.useWatch('fuente', form)

  useEffect(() => {
    if (open) form.setFieldsValue(seccion ?? {
      nombre: '', tipo: 'dinamica', fuente: FUENTES[0].value, contenido: '',
    })
  }, [open, seccion, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onOk(values)
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} title={seccion ? 'Editar Sección' : 'Nueva Sección'}
      onOk={handleOk} onCancel={onCancel} okText="Guardar"
      confirmLoading={loading} width={600}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="nombre" label="Nombre de la sección" rules={[{ required: true }]}>
          <Input placeholder="Ej. Editorial, Noticias, Agenda..." />
        </Form.Item>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={TIPOS.map(t => ({
              value: t.value,
              label: <Tag color={t.color}>{t.label}</Tag>,
            }))} />
          </Form.Item>
          <Form.Item name="fuente" label="Tipo de letra" rules={[{ required: true }]} style={{ flex: 2 }}>
            <Select options={FUENTES.map(f => ({
              value: f.value,
              label: <span style={{ fontFamily: f.value }}>{f.label}</span>,
            }))} />
          </Form.Item>
        </div>

        <Form.Item name="contenido" label="Contenido predeterminado">
          <RichTextEditor
            value={form.getFieldValue('contenido')}
            onChange={html => form.setFieldValue('contenido', html)}
            placeholder="Contenido predeterminado (opcional)"
            fontFamily={fuente}
            minHeight={150}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PlantillasPage() {
  const [plantillas,        setPlantillas]        = useState<Plantilla[]>([])
  const [secciones,         setSecciones]         = useState<Seccion[]>([])
  const [plantillaActiva,   setPlantillaActiva]   = useState<Plantilla | null>(null)
  const [modalPlantilla,    setModalPlantilla]    = useState<{ open: boolean; item: Plantilla | null }>({ open: false, item: null })
  const [modalSeccion,      setModalSeccion]      = useState<{ open: boolean; item: Seccion | null }>({ open: false, item: null })
  const [loadingPlantillas, setLoadingPlantillas] = useState(false)
  const [loadingSecciones,  setLoadingSecciones]  = useState(false)

  // ── Carga ──────────────────────────────────────────────────────────────────

  const cargarPlantillas = useCallback(async () => {
    setLoadingPlantillas(true)
    const res = await fetch(`${API}/api/plantillas`)
    setPlantillas(await res.json())
    setLoadingPlantillas(false)
  }, [])

  const cargarSecciones = useCallback(async (plantillaId: number) => {
    setLoadingSecciones(true)
    const res = await fetch(`${API}/api/plantillas/${plantillaId}/secciones`)
    setSecciones(await res.json())
    setLoadingSecciones(false)
  }, [])

  useEffect(() => { cargarPlantillas() }, [cargarPlantillas])

  useEffect(() => {
    if (plantillaActiva) cargarSecciones(plantillaActiva.id)
    else setSecciones([])
  }, [plantillaActiva, cargarSecciones])

  // ── CRUD Plantillas ────────────────────────────────────────────────────────

  const guardarPlantilla = async (values: { nombre: string; descripcion: string }) => {
    const url    = modalPlantilla.item ? `${API}/api/plantillas/${modalPlantilla.item.id}` : `${API}/api/plantillas`
    const method = modalPlantilla.item ? 'PUT' : 'POST'
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    if (!res.ok) { message.error('Error al guardar'); return }
    message.success(modalPlantilla.item ? 'Plantilla actualizada' : 'Plantilla creada')
    setModalPlantilla({ open: false, item: null })
    await cargarPlantillas()
  }

  const eliminarPlantilla = async (id: number) => {
    await fetch(`${API}/api/plantillas/${id}`, { method: 'DELETE' })
    message.success('Plantilla eliminada')
    if (plantillaActiva?.id === id) setPlantillaActiva(null)
    await cargarPlantillas()
  }

  // ── CRUD Secciones ─────────────────────────────────────────────────────────

  const guardarSeccion = async (values: Partial<Seccion>) => {
    if (!plantillaActiva) return
    const url    = modalSeccion.item ? `${API}/api/secciones/${modalSeccion.item.id}` : `${API}/api/plantillas/${plantillaActiva.id}/secciones`
    const method = modalSeccion.item ? 'PUT' : 'POST'
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    if (!res.ok) { message.error('Error al guardar'); return }
    message.success(modalSeccion.item ? 'Sección actualizada' : 'Sección creada')
    setModalSeccion({ open: false, item: null })
    await cargarSecciones(plantillaActiva.id)
    await cargarPlantillas()
  }

  const eliminarSeccion = async (id: number) => {
    await fetch(`${API}/api/secciones/${id}`, { method: 'DELETE' })
    message.success('Sección eliminada')
    if (plantillaActiva) {
      await cargarSecciones(plantillaActiva.id)
      await cargarPlantillas()
    }
  }

  // ── Columnas ───────────────────────────────────────────────────────────────

  const colsPlantilla: ColumnsType<Plantilla> = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', render: (v, r) => (
        <Button type="link" style={{ padding: 0, fontWeight: plantillaActiva?.id === r.id ? 700 : 400 }}
          onClick={() => setPlantillaActiva(r)}>{v}</Button>
      ),
    },
    { title: 'Secciones', dataIndex: 'total_secciones', key: 'total', width: 90, align: 'center' },
    { title: '', key: 'actions', width: 80, render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Editar"><Button size="small" icon={<EditOutlined />}
            onClick={() => setModalPlantilla({ open: true, item: r })} /></Tooltip>
          <Popconfirm title="¿Eliminar esta plantilla?" okText="Sí" cancelText="No"
            onConfirm={() => eliminarPlantilla(r.id)}>
            <Tooltip title="Eliminar"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const colsSeccion: ColumnsType<Seccion> = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 110, render: tipoTag },
    { title: 'Fuente', dataIndex: 'fuente', key: 'fuente', width: 160,
      render: (v: string) => <span style={{ fontFamily: v, fontSize: 13 }}>{FUENTES.find(f => f.value === v)?.label ?? v}</span>,
    },
    { title: '', key: 'actions', width: 80, render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Editar"><Button size="small" icon={<EditOutlined />}
            onClick={() => setModalSeccion({ open: true, item: r })} /></Tooltip>
          <Popconfirm title="¿Eliminar esta sección?" okText="Sí" cancelText="No"
            onConfirm={() => eliminarSeccion(r.id)}>
            <Tooltip title="Eliminar"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppstoreOutlined style={{ fontSize: 24, color: FMRE_BLUE }} />
        <Title level={3} style={{ margin: 0, color: FMRE_DARK }}>Plantillas de Boletín</Title>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Panel izquierdo: Plantillas */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ color: FMRE_DARK, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UnorderedListOutlined /> Plantillas
            </Text>
            <Button size="small" type="primary" icon={<PlusOutlined />}
              style={{ background: FMRE_BLUE }} onClick={() => setModalPlantilla({ open: true, item: null })}>
              Nueva
            </Button>
          </div>
          <Table
            dataSource={plantillas} rowKey="id" columns={colsPlantilla}
            loading={loadingPlantillas} size="small" pagination={false}
            showHeader={false}
            rowClassName={r => r.id === plantillaActiva?.id ? 'ant-table-row-selected' : ''}
          />
        </div>

        {/* Panel derecho: Secciones */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          {!plantillaActiva ? (
            <Empty description="Selecciona una plantilla para ver sus secciones"
              image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '40px 0' }} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong style={{ color: FMRE_DARK }}>
                  Secciones · <span style={{ color: FMRE_BLUE }}>{plantillaActiva.nombre}</span>
                </Text>
                <Button size="small" type="primary" icon={<PlusOutlined />}
                  style={{ background: FMRE_BLUE }}
                  onClick={() => setModalSeccion({ open: true, item: null })}>
                  Nueva sección
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {TIPOS.map(t => (
                  <Tag key={t.value} color={t.color}>{t.label}</Tag>
                ))}
              </div>
              <Divider style={{ margin: '8px 0 12px' }} />

              <Table dataSource={secciones} rowKey="id" columns={colsSeccion}
                loading={loadingSecciones} size="small" pagination={false} />
            </>
          )}
        </div>
      </div>

      <PlantillaModal
        open={modalPlantilla.open} plantilla={modalPlantilla.item}
        onOk={guardarPlantilla} onCancel={() => setModalPlantilla({ open: false, item: null })}
      />
      <SeccionModal
        open={modalSeccion.open} seccion={modalSeccion.item}
        onOk={guardarSeccion} onCancel={() => setModalSeccion({ open: false, item: null })}
      />
    </div>
  )
}
