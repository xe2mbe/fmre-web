import { useState, useEffect, useCallback } from 'react'
import {
  Button, Card, Input, Divider, Empty, Tooltip, Typography,
  Space, DatePicker, Select, Tag, Modal, Alert,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  ReadOutlined, EyeOutlined, AppstoreOutlined, FileTextOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor'

const { Title, Text } = Typography
const FMRE_DARK = '#0D2E5F'
const FMRE_BLUE = '#1A569E'
const API = (import.meta.env.VITE_EQMS_URL as string) || ''

const TIPO_TAG: Record<string, { label: string; color: string }> = {
  estatica:  { label: 'Estática',  color: 'blue'   },
  dinamica:  { label: 'Dinámica',  color: 'green'  },
  temporal:  { label: 'Temporal',  color: 'orange' },
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PlantillaResumen {
  id: number; nombre: string
}

interface Plantilla {
  id: number; nombre: string; descripcion: string
  fuente_titulo: string; tamano_titulo: string
  fuente_cuerpo: string; tamano_cuerpo: string
  enc_contenido: string; enc_fuente: string; enc_tamano: string; enc_paginas: string
  pie_contenido: string; pie_fuente: string; pie_tamano: string; pie_paginas: string
  num_pagina: number; num_pagina_pos: string; num_pagina_fmt: string
}

interface Seccion {
  id:       string
  nombre:   string
  tipo:     string
  contenido: string
}

interface Boletin {
  titulo:     string
  numero:     string
  fecha:      Dayjs | null
  plantilla:  Plantilla | null
  encabezado: string
  pie:        string
  secciones:  Seccion[]
}

// ── Sección card ──────────────────────────────────────────────────────────────

function SeccionCard({
  seccion, index, total, plantilla,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  seccion:    Seccion
  index:      number
  total:      number
  plantilla:  Plantilla | null
  onChange:   (id: string, field: keyof Seccion, val: string) => void
  onDelete:   (id: string) => void
  onMoveUp:   (i: number) => void
  onMoveDown: (i: number) => void
}) {
  const tituloStyle = plantilla ? {
    fontFamily: plantilla.fuente_titulo,
    fontSize:   `${plantilla.tamano_titulo}px`,
    fontWeight: 600 as const,
  } : { fontWeight: 600 as const }

  const tipo = TIPO_TAG[seccion.tipo] ?? { label: seccion.tipo, color: 'default' }

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderLeft: `4px solid ${FMRE_BLUE}`, borderRadius: 10 }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: FMRE_DARK, fontWeight: 700, fontSize: 12 }}>
            Sección {index + 1}
          </span>
          <Tag color={tipo.color} style={{ margin: 0 }}>{tipo.label}</Tag>
        </div>
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
        value={seccion.nombre}
        onChange={e => onChange(seccion.id, 'nombre', e.target.value)}
        variant="filled"
        size="small"
        styles={{ input: tituloStyle }}
        style={{ marginBottom: 10 }}
      />
      <RichTextEditor
        value={seccion.contenido}
        onChange={html => onChange(seccion.id, 'contenido', html)}
        placeholder="Escribe el contenido de esta sección..."
        fontFamily={plantilla?.fuente_cuerpo}
        minHeight={180}
      />
      {plantilla && (
        <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 11, color: '#aaa' }}>
          <span>Nombre: <b>{plantilla.fuente_titulo} {plantilla.tamano_titulo}px</b></span>
          <span>Cuerpo: <b>{plantilla.fuente_cuerpo} {plantilla.tamano_cuerpo}px</b></span>
        </div>
      )}
    </Card>
  )
}

// ── Área de encabezado / pie ──────────────────────────────────────────────────

function HeaderFooterArea({
  titulo, contenido, fuente, tamano, paginas, icon, color,
  onChange,
}: {
  titulo: string; contenido: string; fuente: string
  tamano: string; paginas: string; icon: React.ReactNode; color: string
  onChange: (html: string) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderLeft: `4px solid ${color}`, borderRadius: 10 }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ color: FMRE_DARK, fontWeight: 700, fontSize: 12 }}>{titulo}</span>
          <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
            {fuente} {tamano}px · {paginas === 'todas' ? 'Todas las páginas' : 'Solo primera página'}
          </Tag>
        </div>
      }
      extra={
        <Button size="small" type="text" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Contraer' : 'Expandir'}
        </Button>
      }
    >
      {expanded && (
        <RichTextEditor
          value={contenido}
          onChange={onChange}
          placeholder={`Contenido del ${titulo.toLowerCase()}...`}
          fontFamily={fuente}
          minHeight={100}
        />
      )}
    </Card>
  )
}

// ── Vista previa ──────────────────────────────────────────────────────────────

function PreviewModal({ boletin, onClose }: { boletin: Boletin; onClose: () => void }) {
  const p = boletin.plantilla

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 12, padding: '40px 48px',
        maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>

        {/* Encabezado */}
        {p && boletin.encabezado && (
          <div style={{
            fontFamily: p.enc_fuente, fontSize: `${p.enc_tamano}px`,
            borderBottom: '1px solid #e0e0e0', paddingBottom: 12, marginBottom: 20,
          }} dangerouslySetInnerHTML={{ __html: boletin.encabezado }} />
        )}

        {/* Cabecera del boletín */}
        <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: `3px solid ${FMRE_DARK}`, paddingBottom: 16 }}>
          <img src="/fmre.webp" alt="FMRE" style={{ height: 48, marginBottom: 8 }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: FMRE_DARK }}>
            {boletin.titulo || 'Boletín Dominical FMRE'}
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {boletin.numero && `Núm. ${boletin.numero}`}
            {boletin.numero && boletin.fecha && ' · '}
            {boletin.fecha && boletin.fecha.format('DD [de] MMMM [de] YYYY')}
          </div>
          {p && (
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              Plantilla: {p.nombre}
            </div>
          )}
        </div>

        {/* Secciones */}
        {boletin.secciones.map((s, i) => (
          <div key={s.id} style={{ marginBottom: 24 }}>
            {s.nombre && (
              <div style={{
                fontFamily: p?.fuente_titulo ?? 'inherit',
                fontSize:   p ? `${p.tamano_titulo}px` : 15,
                fontWeight: 700, color: FMRE_BLUE,
                borderBottom: '1px solid #e0e8f5', paddingBottom: 6, marginBottom: 10,
              }}>
                {s.nombre}
                {s.tipo && s.tipo !== 'dinamica' && (
                  <Tag color={TIPO_TAG[s.tipo]?.color} style={{ marginLeft: 8, fontSize: 10 }}>
                    {TIPO_TAG[s.tipo]?.label}
                  </Tag>
                )}
              </div>
            )}
            <div
              style={{ fontFamily: p?.fuente_cuerpo ?? 'inherit', fontSize: p ? `${p.tamano_cuerpo}px` : 14, lineHeight: 1.8, color: '#333' }}
              dangerouslySetInnerHTML={{ __html: s.contenido || '<span style="color:#ccc">(sin contenido)</span>' }}
            />
            {i < boletin.secciones.length - 1 && <Divider style={{ margin: '16px 0' }} />}
          </div>
        ))}

        {/* Pie de página */}
        {p && boletin.pie && (
          <div style={{
            fontFamily: p.pie_fuente, fontSize: `${p.pie_tamano}px`,
            borderTop: '1px solid #e0e0e0', paddingTop: 12, marginTop: 20, color: '#666',
          }} dangerouslySetInnerHTML={{ __html: boletin.pie }} />
        )}

        {/* Número de página */}
        {p?.num_pagina ? (
          <div style={{
            textAlign: p.num_pagina_pos === 'izquierda' ? 'left' : p.num_pagina_pos === 'derecha' ? 'right' : 'center',
            fontSize: 11, color: '#aaa', marginTop: 16,
          }}>
            {p.num_pagina_fmt === 'X' ? '1'
              : p.num_pagina_fmt === 'Pagina X' ? 'Página 1'
              : '1 de 1'}
          </div>
        ) : null}

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Button onClick={onClose}>Cerrar vista previa</Button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BoletinesPage() {
  const [boletin, setBoletin] = useState<Boletin>({
    titulo: 'Boletín Dominical FMRE', numero: '', fecha: null,
    plantilla: null, encabezado: '', pie: '',
    secciones: [],
  })
  const [preview,    setPreview]    = useState(false)
  const [plantillas, setPlantillas] = useState<PlantillaResumen[]>([])
  const [loadingP,   setLoadingP]   = useState(false)

  // Cargar lista de plantillas
  useEffect(() => {
    fetch(`${API}/api/plantillas`)
      .then(r => r.json())
      .then(data => setPlantillas(data.map((p: any) => ({ id: p.id, nombre: p.nombre }))))
      .catch(() => {})
  }, [])

  const setField = (field: keyof Omit<Boletin, 'secciones' | 'plantilla'>, value: unknown) =>
    setBoletin(b => ({ ...b, [field]: value }))

  // Seleccionar plantilla
  const onSelectPlantilla = useCallback(async (id: number | null) => {
    if (!id) {
      setBoletin(b => ({ ...b, plantilla: null, encabezado: '', pie: '' }))
      return
    }

    const confirmReplace = boletin.secciones.length > 0
      ? window.confirm('¿Reemplazar las secciones actuales con las de la plantilla?')
      : true

    setLoadingP(true)
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API}/api/plantillas/${id}`),
        fetch(`${API}/api/plantillas/${id}/secciones`),
      ])
      const plantilla: Plantilla = await pRes.json()
      const seccionesAPI: any[]  = await sRes.json()

      const secciones: Seccion[] = seccionesAPI.map(s => ({
        id:       crypto.randomUUID(),
        nombre:   s.nombre,
        tipo:     s.tipo,
        contenido: s.contenido || '',
      }))

      setBoletin(b => ({
        ...b,
        plantilla,
        encabezado: plantilla.enc_contenido || '',
        pie:        plantilla.pie_contenido || '',
        secciones:  confirmReplace ? secciones : b.secciones,
      }))
    } finally {
      setLoadingP(false)
    }
  }, [boletin.secciones.length])

  const agregarSeccion = () =>
    setBoletin(b => ({
      ...b,
      secciones: [...b.secciones, {
        id: crypto.randomUUID(), nombre: '', tipo: 'dinamica', contenido: '',
      }],
    }))

  const cambiarSeccion = (id: string, field: keyof Seccion, val: string) =>
    setBoletin(b => ({
      ...b,
      secciones: b.secciones.map(s => s.id === id ? { ...s, [field]: val } : s),
    }))

  const eliminarSeccion = (id: string) =>
    setBoletin(b => ({ ...b, secciones: b.secciones.filter(s => s.id !== id) }))

  const moverSeccion = (index: number, dir: -1 | 1) =>
    setBoletin(b => {
      const arr = [...b.secciones]
      const tmp = arr[index]; arr[index] = arr[index + dir]; arr[index + dir] = tmp
      return { ...b, secciones: arr }
    })

  return (
    <div>
      {/* Encabezado de página */}
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
            <Input value={boletin.titulo} onChange={e => setField('titulo', e.target.value)}
              style={{ marginTop: 4, fontWeight: 600 }} placeholder="Boletín Dominical FMRE" />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Número</Text>
            <Input value={boletin.numero} onChange={e => setField('numero', e.target.value)}
              style={{ marginTop: 4 }} placeholder="Ej. 1450" />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Fecha</Text>
            <DatePicker value={boletin.fecha} onChange={d => setField('fecha', d)}
              style={{ width: '100%', marginTop: 4 }} format="DD/MM/YYYY" placeholder="Selecciona fecha" />
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AppstoreOutlined /> Plantilla
            </Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="Selecciona una plantilla (opcional)"
              loading={loadingP}
              allowClear
              value={boletin.plantilla?.id ?? null}
              onChange={val => onSelectPlantilla(val ?? null)}
              options={plantillas.map(p => ({ value: p.id, label: p.nombre }))}
            />
          </div>
        </div>

        {/* Resumen de tipografía de la plantilla */}
        {boletin.plantilla && (
          <div style={{
            marginTop: 12, padding: '8px 12px', background: '#f5f7ff',
            border: '1px solid #e0e8ff', borderRadius: 8,
            display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: '#555',
          }}>
            <span>
              <b style={{ color: FMRE_BLUE }}>Plantilla:</b> {boletin.plantilla.nombre}
            </span>
            <span>
              Nombre sección: <b style={{ fontFamily: boletin.plantilla.fuente_titulo }}>
                {boletin.plantilla.fuente_titulo.split(',')[0]} {boletin.plantilla.tamano_titulo}px
              </b>
            </span>
            <span>
              Cuerpo: <b style={{ fontFamily: boletin.plantilla.fuente_cuerpo }}>
                {boletin.plantilla.fuente_cuerpo.split(',')[0]} {boletin.plantilla.tamano_cuerpo}px
              </b>
            </span>
            {boletin.plantilla.num_pagina ? (
              <span>Núm. página: <b>{boletin.plantilla.num_pagina_pos} · {boletin.plantilla.num_pagina_fmt}</b></span>
            ) : null}
          </div>
        )}
      </Card>

      {/* Encabezado */}
      {boletin.plantilla && (
        <HeaderFooterArea
          titulo="Encabezado"
          contenido={boletin.encabezado}
          fuente={boletin.plantilla.enc_fuente}
          tamano={boletin.plantilla.enc_tamano}
          paginas={boletin.plantilla.enc_paginas}
          icon={<FileTextOutlined style={{ color: '#722ed1' }} />}
          color="#722ed1"
          onChange={html => setField('encabezado', html)}
        />
      )}

      {/* Secciones */}
      {boletin.secciones.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={boletin.plantilla
            ? 'La plantilla no tiene secciones predefinidas. Agrega una manualmente.'
            : 'No hay secciones. Selecciona una plantilla o agrega secciones manualmente.'}
          style={{ margin: '32px 0' }} />
      ) : (
        boletin.secciones.map((s, i) => (
          <SeccionCard
            key={s.id} seccion={s} index={i} total={boletin.secciones.length}
            plantilla={boletin.plantilla}
            onChange={cambiarSeccion}
            onDelete={eliminarSeccion}
            onMoveUp={idx => moverSeccion(idx, -1)}
            onMoveDown={idx => moverSeccion(idx, 1)}
          />
        ))
      )}

      {/* Botón agregar */}
      <Button type="dashed" block size="large" icon={<PlusOutlined />}
        onClick={agregarSeccion}
        style={{ marginTop: 8, borderColor: FMRE_BLUE, color: FMRE_BLUE }}>
        Agregar sección
      </Button>

      {/* Pie de página */}
      {boletin.plantilla && (
        <div style={{ marginTop: 16 }}>
          <HeaderFooterArea
            titulo="Pie de página"
            contenido={boletin.pie}
            fuente={boletin.plantilla.pie_fuente}
            tamano={boletin.plantilla.pie_tamano}
            paginas={boletin.plantilla.pie_paginas}
            icon={<FileTextOutlined style={{ color: '#d46b08' }} />}
            color="#d46b08"
            onChange={html => setField('pie', html)}
          />
        </div>
      )}

      {preview && <PreviewModal boletin={boletin} onClose={() => setPreview(false)} />}
    </div>
  )
}
