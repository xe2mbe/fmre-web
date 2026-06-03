import { useState } from 'react'
import {
  Button, Card, Input, Divider, Empty, Tooltip, Typography, Space, DatePicker,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  ReadOutlined, EyeOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor'

const { Title, Text } = Typography

const FMRE_DARK = '#0D2E5F'
const FMRE_BLUE = '#1A569E'


// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Seccion {
  id:       string
  titulo:   string
  contenido: string
}

interface Boletin {
  titulo:  string
  numero:  string
  fecha:   Dayjs | null
  secciones: Seccion[]
}

// ── Componente de sección ─────────────────────────────────────────────────────

function SeccionCard({
  seccion, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  seccion:    Seccion
  index:      number
  total:      number
  onChange:   (id: string, field: keyof Seccion, value: string) => void
  onDelete:   (id: string) => void
  onMoveUp:   (index: number) => void
  onMoveDown: (index: number) => void
}) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderLeft: `4px solid ${FMRE_BLUE}`, borderRadius: 10 }}
      title={
        <span style={{ color: FMRE_DARK, fontWeight: 700, fontSize: 13 }}>
          Sección {index + 1}
        </span>
      }
      extra={
        <Space size={4}>
          <Tooltip title="Mover arriba">
            <Button size="small" icon={<ArrowUpOutlined />}
              disabled={index === 0} onClick={() => onMoveUp(index)} />
          </Tooltip>
          <Tooltip title="Mover abajo">
            <Button size="small" icon={<ArrowDownOutlined />}
              disabled={index === total - 1} onClick={() => onMoveDown(index)} />
          </Tooltip>
          <Tooltip title="Eliminar sección">
            <Button size="small" danger icon={<DeleteOutlined />}
              onClick={() => onDelete(seccion.id)} />
          </Tooltip>
        </Space>
      }
    >
      <Input
        placeholder="Nombre de la sección (ej. Editorial, Noticias...)"
        value={seccion.titulo}
        onChange={e => onChange(seccion.id, 'titulo', e.target.value)}
        variant="filled"
        size="small"
        style={{ marginBottom: 10, fontWeight: 600 }}
      />
      <RichTextEditor
        value={seccion.contenido}
        onChange={html => onChange(seccion.id, 'contenido', html)}
        placeholder="Escribe el contenido de esta sección..."
        minHeight={180}
      />
    </Card>
  )
}

// ── Modal de vista previa ──────────────────────────────────────────────────────

function PreviewModal({ boletin, onClose }: { boletin: Boletin; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 12, padding: '40px 48px',
        maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: `3px solid ${FMRE_DARK}`, paddingBottom: 20 }}>
          <img src="/fmre.webp" alt="FMRE" style={{ height: 50, marginBottom: 8 }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: FMRE_DARK }}>
            {boletin.titulo || 'Boletín Dominical FMRE'}
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {boletin.numero && `Núm. ${boletin.numero}`}
            {boletin.numero && boletin.fecha && ' · '}
            {boletin.fecha && boletin.fecha.format('DD [de] MMMM [de] YYYY')}
          </div>
        </div>

        {/* Secciones */}
        {boletin.secciones.map((s, i) => (
          <div key={s.id} style={{ marginBottom: 28 }}>
            {s.titulo && (
              <div style={{
                fontWeight: 700,
                fontSize:   s.tamano_titulo ? `${s.tamano_titulo}px` : 15,
                color:      FMRE_BLUE,
                fontFamily: s.fuente_titulo || s.fuente,
                borderBottom: `1px solid #e0e8f5`, paddingBottom: 6, marginBottom: 10,
              }}>
                {s.titulo}
              </div>
            )}
            <div style={{ fontFamily: s.fuente, fontSize: 14, lineHeight: 1.8, color: '#333' }}
              dangerouslySetInnerHTML={{ __html: s.contenido || '<span style="color:#ccc">(sin contenido)</span>' }}
            />
            {i < boletin.secciones.length - 1 && (
              <Divider style={{ margin: '20px 0' }} />
            )}
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button onClick={onClose}>Cerrar vista previa</Button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BoletinesPage() {
  const [boletin, setBoletin] = useState<Boletin>({
    titulo: 'Boletín Dominical FMRE',
    numero: '',
    fecha:  null,
    secciones: [],
  })
  const [preview, setPreview] = useState(false)

  const setField = (field: keyof Omit<Boletin, 'secciones'>, value: unknown) =>
    setBoletin(b => ({ ...b, [field]: value }))

  const agregarSeccion = () =>
    setBoletin(b => ({
      ...b,
      secciones: [...b.secciones, {
        id:       crypto.randomUUID(),
        titulo:   '',
        contenido: '',
      }],
    }))

  const cambiarSeccion = (id: string, field: keyof Seccion, value: string) =>
    setBoletin(b => ({
      ...b,
      secciones: b.secciones.map(s => s.id === id ? { ...s, [field]: value } : s),
    }))

  const eliminarSeccion = (id: string) =>
    setBoletin(b => ({ ...b, secciones: b.secciones.filter(s => s.id !== id) }))

  const moverSeccion = (index: number, dir: -1 | 1) =>
    setBoletin(b => {
      const arr = [...b.secciones]
      const tmp = arr[index]
      arr[index] = arr[index + dir]
      arr[index + dir] = tmp
      return { ...b, secciones: arr }
    })

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ReadOutlined style={{ fontSize: 24, color: FMRE_BLUE }} />
          <Title level={3} style={{ margin: 0, color: FMRE_DARK }}>Editor de Boletín</Title>
        </div>
        <Button icon={<EyeOutlined />} onClick={() => setPreview(true)}
          disabled={boletin.secciones.length === 0}>
          Vista previa
        </Button>
      </div>

      {/* Datos del boletín */}
      <Card style={{ marginBottom: 20, borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Título del boletín</Text>
            <Input
              value={boletin.titulo}
              onChange={e => setField('titulo', e.target.value)}
              style={{ marginTop: 4, fontWeight: 600 }}
              placeholder="Boletín Dominical FMRE"
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Número</Text>
            <Input
              value={boletin.numero}
              onChange={e => setField('numero', e.target.value)}
              style={{ marginTop: 4 }}
              placeholder="Ej. 1450"
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Fecha</Text>
            <DatePicker
              value={boletin.fecha}
              onChange={date => setField('fecha', date)}
              style={{ width: '100%', marginTop: 4 }}
              format="DD/MM/YYYY"
              placeholder="Selecciona fecha"
            />
          </div>
        </div>
      </Card>

      {/* Secciones */}
      {boletin.secciones.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No hay secciones aún"
          style={{ margin: '40px 0' }}
        />
      ) : (
        boletin.secciones.map((s, i) => (
          <SeccionCard
            key={s.id}
            seccion={s}
            index={i}
            total={boletin.secciones.length}
            onChange={cambiarSeccion}
            onDelete={eliminarSeccion}
            onMoveUp={idx => moverSeccion(idx, -1)}
            onMoveDown={idx => moverSeccion(idx, 1)}
          />
        ))
      )}

      {/* Botón agregar */}
      <Button
        type="dashed" block size="large"
        icon={<PlusOutlined />}
        onClick={agregarSeccion}
        style={{ marginTop: 8, borderColor: FMRE_BLUE, color: FMRE_BLUE }}
      >
        Agregar sección
      </Button>

      {/* Vista previa */}
      {preview && <PreviewModal boletin={boletin} onClose={() => setPreview(false)} />}
    </div>
  )
}
