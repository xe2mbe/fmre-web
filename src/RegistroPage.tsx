import { useState } from 'react'
import {
  Steps, Form, Input, Select, Button, DatePicker, Radio,
  Row, Col, Alert, Divider, Result, Checkbox,
} from 'antd'
import {
  UserOutlined, HomeOutlined, WifiOutlined,
  LockOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  CheckCircleOutlined, GlobalOutlined,
} from '@ant-design/icons'

const { Option } = Select
const EQMS_URL = (import.meta.env.VITE_EQMS_URL as string) || ''
const FMRE_BLUE = '#1A569E'
const FMRE_DARK = '#0D2E5F'

// ─── Catálogos ───────────────────────────────────────────────────────────────

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Guanajuato',
  'Guerrero','Hidalgo','Jalisco','Estado de México','Michoacán','Morelos',
  'Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas',
]

const PAISES = [
  'México','Estados Unidos','Canadá','Argentina','Brasil','Chile','Colombia',
  'Cuba','Venezuela','España','Guatemala','Honduras','Nicaragua','Costa Rica',
  'Panamá','El Salvador','República Dominicana','Otro',
]

const TIPOS_LICENCIA_MX = ['Clase I','Clase II','Clase III']
const TIPOS_LICENCIA_EXT = ['Clase A (Novice)','Clase B (General)','Clase C (Extra/Advanced)','Extra','Full']

const STEPS = [
  { title: 'Tipo', icon: <UserOutlined /> },
  { title: 'Datos Personales', icon: <UserOutlined /> },
  { title: 'Domicilio', icon: <HomeOutlined /> },
  { title: 'Radioafición', icon: <WifiOutlined /> },
  { title: 'Acceso', icon: <LockOutlined /> },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function RegistroPage({ onClose }: Props) {
  const [current, setCurrent] = useState(0)
  const [tipo, setTipo] = useState<'radioaficionado' | 'swl' | 'extranjero' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [form] = Form.useForm()
  const [extranjero, setExtranjero] = useState(false)

  const next = async () => {
    try {
      await form.validateFields(getFieldsForStep(current))
      setCurrent(c => c + 1)
      setError(null)
    } catch {
      // validation errors shown inline
    }
  }

  const prev = () => setCurrent(c => c - 1)

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0: return ['tipo_membresia']
      case 1: return ['nombre','primer_apellido','segundo_apellido','fecha_nacimiento','genero','email','telefono']
      case 2: return ['calle','numero_ext','colonia','municipio','ciudad','estado','codigo_postal','pais']
      case 3:
        if (tipo === 'swl') return ['swl_id','como_entero']
        if (tipo === 'extranjero') return ['indicativo','pais_origen','tipo_licencia_ext']
        return ['indicativo','tipo_licencia','numero_licencia']
      case 4: return ['username','password','confirmar_password','acepta_terminos']
      default: return []
    }
  }

  const handleSubmit = async () => {
    try {
      await form.validateFields()
    } catch { return }

    setLoading(true)
    setError(null)
    try {
      const values = form.getFieldsValue(true)
      const payload = {
        tipo_membresia:     values.tipo_membresia,
        nombre:             values.nombre,
        primer_apellido:    values.primer_apellido,
        segundo_apellido:   values.segundo_apellido ?? '',
        fecha_nacimiento:   values.fecha_nacimiento?.format('YYYY-MM-DD'),
        genero:             values.genero,
        email:              values.email,
        telefono:           values.telefono ?? '',
        // Domicilio
        calle:              values.calle,
        numero_ext:         values.numero_ext,
        numero_int:         values.numero_int ?? '',
        colonia:            values.colonia,
        municipio:          values.municipio,
        ciudad:             values.ciudad,
        estado:             values.estado,
        codigo_postal:      values.codigo_postal,
        pais:               values.pais ?? 'México',
        // Radioafición
        indicativo:         values.indicativo ?? '',
        tipo_licencia:      values.tipo_licencia ?? values.tipo_licencia_ext ?? '',
        numero_licencia:    values.numero_licencia ?? '',
        pais_origen:        values.pais_origen ?? '',
        swl_id:             values.swl_id ?? '',
        // Acceso
        username:           values.username,
        password:           values.password,
        // Meta
        pre_registro:       true,
      }

      const res = await fetch(`${EQMS_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.detail ?? 'Error al registrar. Intenta de nuevo.')
        return
      }

      setDone(true)
    } catch {
      setError('No se pudo conectar con el portal. Intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: FMRE_BLUE }} />}
          title="¡Pre-registro enviado!"
          subTitle="Tu solicitud ha sido recibida. Un administrador la revisará y recibirás un correo de confirmación con los próximos pasos para completar tu afiliación."
          extra={
            <Button type="primary" onClick={onClose}
              style={{ background: FMRE_BLUE, borderColor: FMRE_BLUE }}>
              Volver a la página principal
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: FMRE_DARK, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#8ab4e0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeftOutlined /> Regresar
        </button>
        <div style={{ flex: 1 }} />
        <img src="/fmre.webp" alt="FMRE" style={{ height: 36 }} />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Pre-Registro de Membresía</span>
      </div>

      {/* Steps */}
      <div style={{ background: 'white', padding: '20px 24px', borderBottom: '1px solid #e8ecf0' }}>
        <Steps current={current} size="small" items={STEPS} responsive={false}
          style={{ maxWidth: 700, margin: '0 auto' }} />
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 16px' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>

          {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} style={{ marginBottom: 20 }} />}

          <Form form={form} layout="vertical" size="middle">

            {/* ── PASO 0: Tipo de membresía ── */}
            {current === 0 && (
              <>
                <h2 style={{ color: FMRE_DARK, fontWeight: 800, marginBottom: 8 }}>¿Cómo deseas afiliarte?</h2>
                <p style={{ color: '#666', marginBottom: 24 }}>Selecciona la categoría que corresponde a tu situación.</p>
                <Form.Item name="tipo_membresia" rules={[{ required: true, message: 'Selecciona un tipo de membresía' }]}>
                  <Radio.Group onChange={e => { setTipo(e.target.value); setExtranjero(e.target.value === 'extranjero') }}
                    style={{ width: '100%' }}>
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                      {[
                        { value: 'radioaficionado', label: 'Radioaficionado Mexicano', icon: '📡', desc: 'Cuento con licencia IFT vigente' },
                        { value: 'swl',             label: 'Radioescucha / SWL',      icon: '🎧', desc: 'Short Wave Listener, sin indicativo' },
                        { value: 'extranjero',      label: 'Radioaficionado Extranjero', icon: '🌎', desc: 'Licencia expedida en otro país' },
                      ].map(op => (
                        <Radio.Button key={op.value} value={op.value}
                          style={{ height: 'auto', padding: '16px', textAlign: 'center', borderRadius: 12, whiteSpace: 'normal' }}>
                          <div style={{ fontSize: 28, marginBottom: 6 }}>{op.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: FMRE_DARK }}>{op.label}</div>
                          <div style={{ fontSize: 11, color: '#888', marginTop: 4, fontWeight: 400 }}>{op.desc}</div>
                        </Radio.Button>
                      ))}
                    </div>
                  </Radio.Group>
                </Form.Item>
              </>
            )}

            {/* ── PASO 1: Datos personales ── */}
            {current === 1 && (
              <>
                <h2 style={{ color: FMRE_DARK, fontWeight: 800, marginBottom: 24 }}>Datos personales</h2>
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Nombre(s)" name="nombre" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="Ej. Juan Carlos" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Primer apellido" name="primer_apellido" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="Ej. García" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Segundo apellido" name="segundo_apellido">
                      <Input placeholder="Ej. López (opcional)" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Fecha de nacimiento" name="fecha_nacimiento" rules={[{ required: true, message: 'Requerido' }]}>
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="DD/MM/AAAA" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Género" name="genero" rules={[{ required: true, message: 'Requerido' }]}>
                      <Select placeholder="Selecciona">
                        <Option value="M">Masculino</Option>
                        <Option value="F">Femenino</Option>
                        <Option value="NB">No binario</Option>
                        <Option value="ND">Prefiero no decir</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Teléfono / Celular" name="telefono">
                      <Input placeholder="10 dígitos" maxLength={15} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Correo electrónico" name="email"
                      rules={[{ required: true, message: 'Requerido' }, { type: 'email', message: 'Correo inválido' }]}>
                      <Input placeholder="correo@ejemplo.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {/* ── PASO 2: Domicilio ── */}
            {current === 2 && (
              <>
                <h2 style={{ color: FMRE_DARK, fontWeight: 800, marginBottom: 24 }}>Domicilio</h2>
                <Row gutter={12}>
                  <Col xs={24} sm={16}>
                    <Form.Item label="Calle" name="calle" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="Nombre de la calle" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Form.Item label="Núm. Ext." name="numero_ext" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="123" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Form.Item label="Núm. Int." name="numero_int">
                      <Input placeholder="A (opcional)" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Colonia / Barrio / Urbanización" name="colonia" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="Nombre de la colonia" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Municipio / Delegación" name="municipio" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="Municipio" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Ciudad" name="ciudad" rules={[{ required: true, message: 'Requerido' }]}>
                      <Input placeholder="Ciudad" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item label="Código Postal" name="codigo_postal" rules={[{ required: true, message: 'Requerido' },
                      { pattern: /^\d{4,10}$/, message: 'CP inválido' }]}>
                      <Input placeholder="00000" maxLength={10} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item label="País" name="pais" initialValue={extranjero ? undefined : 'México'}
                      rules={[{ required: true, message: 'Requerido' }]}>
                      {extranjero
                        ? <Select showSearch optionFilterProp="label"
                            options={PAISES.map(p => ({ value: p, label: p }))} placeholder="País" />
                        : <Input readOnly defaultValue="México" />
                      }
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Estado / Provincia" name="estado" rules={[{ required: true, message: 'Requerido' }]}>
                      {extranjero
                        ? <Input placeholder="Estado o Provincia" />
                        : <Select showSearch optionFilterProp="label"
                            options={ESTADOS_MX.map(e => ({ value: e, label: e }))}
                            placeholder="Selecciona un estado" />
                      }
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {/* ── PASO 3: Radioafición ── */}
            {current === 3 && (
              <>
                <h2 style={{ color: FMRE_DARK, fontWeight: 800, marginBottom: 24 }}>Datos de radioafición</h2>

                {/* Radioaficionado Mexicano */}
                {tipo === 'radioaficionado' && (
                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Indicativo" name="indicativo"
                        rules={[{ required: true, message: 'Requerido' },
                          { pattern: /^[A-Z0-9]{3,10}$/i, message: 'Indicativo inválido' }]}
                        extra="Indicativo asignado por el IFT. Ej: XE2MBE">
                        <Input placeholder="XE2XXX" maxLength={10} style={{ textTransform: 'uppercase' }}
                          onChange={e => form.setFieldValue('indicativo', e.target.value.toUpperCase())} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Tipo / Clase de licencia" name="tipo_licencia"
                        rules={[{ required: true, message: 'Requerido' }]}>
                        <Select placeholder="Selecciona">
                          {TIPOS_LICENCIA_MX.map(t => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Número de concesión / licencia" name="numero_licencia"
                        rules={[{ required: true, message: 'Requerido' }]}
                        extra="Número del acta de entrega expedida por el IFT">
                        <Input placeholder="Número de documento IFT" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Fecha de expedición" name="fecha_expedicion">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Fecha del documento" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                {/* SWL */}
                {tipo === 'swl' && (
                  <Row gutter={12}>
                    <Divider>
                      <span style={{ fontSize: 13, color: '#888' }}>Los radioescuchas no requieren indicativo oficial</span>
                    </Divider>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Identificador SWL (opcional)" name="swl_id"
                        extra="Si tienes un ID asignado por un club o la FMRE, ingrésalo aquí">
                        <Input placeholder="Ej. XE-SWL-001" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="¿Cómo te enteraste de la FMRE?" name="como_entero">
                        <Select placeholder="Selecciona (opcional)">
                          <Option value="radio">Por radio / boletín dominical</Option>
                          <Option value="redes">Redes sociales</Option>
                          <Option value="conocido">Un radioaficionado conocido</Option>
                          <Option value="internet">Búsqueda en internet</Option>
                          <Option value="otro">Otro</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Bandas o frecuencias de interés" name="bandas_swl">
                        <Select mode="multiple" placeholder="Selecciona las que escuchas (opcional)">
                          <Option value="onda_corta">Onda Corta (HF)</Option>
                          <Option value="vhf">VHF</Option>
                          <Option value="uhf">UHF</Option>
                          <Option value="am_fm">AM / FM</Option>
                          <Option value="aeronautica">Banda aeronáutica</Option>
                          <Option value="maritima">Banda marítima</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                {/* Extranjero */}
                {tipo === 'extranjero' && (
                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Indicativo" name="indicativo"
                        rules={[{ required: true, message: 'Requerido' }]}
                        extra="Indicativo asignado en tu país de origen">
                        <Input placeholder="Ej. W1AW" maxLength={12} style={{ textTransform: 'uppercase' }}
                          onChange={e => form.setFieldValue('indicativo', e.target.value.toUpperCase())} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="País de origen" name="pais_origen" rules={[{ required: true, message: 'Requerido' }]}>
                        <Select showSearch optionFilterProp="label"
                          options={PAISES.map(p => ({ value: p, label: p }))} placeholder="País" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Clase / Tipo de licencia" name="tipo_licencia_ext"
                        rules={[{ required: true, message: 'Requerido' }]}>
                        <Select placeholder="Selecciona">
                          {TIPOS_LICENCIA_EXT.map(t => <Option key={t} value={t}>{t}</Option>)}
                          <Option value="otro">Otro</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Número / Referencia de licencia" name="numero_licencia">
                        <Input placeholder="Número del documento" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Organismo / Entidad emisora" name="organismo_licencia"
                        extra="Ej. FCC, ARRL, OFCOM, INAOE">
                        <Input placeholder="Ej. FCC" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </>
            )}

            {/* ── PASO 4: Acceso ── */}
            {current === 4 && (
              <>
                <h2 style={{ color: FMRE_DARK, fontWeight: 800, marginBottom: 8 }}>Datos de acceso al portal</h2>
                <p style={{ color: '#666', marginBottom: 24 }}>
                  Crea tu usuario y contraseña para acceder al portal de la FMRE.
                </p>
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Nombre de usuario" name="username"
                      rules={[{ required: true, message: 'Requerido' },
                        { min: 4, message: 'Mínimo 4 caracteres' },
                        { pattern: /^[a-z0-9_]+$/i, message: 'Solo letras, números y guión bajo' }]}
                      extra={tipo !== 'swl' ? 'Sugerencia: usa tu indicativo' : undefined}>
                      <Input prefix={<UserOutlined style={{ color: '#bbb' }} />}
                        placeholder={tipo === 'radioaficionado' ? 'Ej. xe2xxx' : 'Ej. juangarcia'}
                        style={{ textTransform: 'lowercase' }}
                        onChange={e => form.setFieldValue('username', e.target.value.toLowerCase())} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Correo electrónico" shouldUpdate noStyle>
                      {() => (
                        <Form.Item label="Confirmar correo">
                          <Input value={form.getFieldValue('email')} readOnly
                            style={{ background: '#f5f5f5', color: '#666' }} />
                        </Form.Item>
                      )}
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Contraseña" name="password"
                      rules={[{ required: true, message: 'Requerido' },
                        { min: 8, message: 'Mínimo 8 caracteres' }]}>
                      <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />}
                        placeholder="Mínimo 8 caracteres" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Confirmar contraseña" name="confirmar_password"
                      dependencies={['password']}
                      rules={[{ required: true, message: 'Requerido' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) return Promise.resolve()
                            return Promise.reject('Las contraseñas no coinciden')
                          },
                        })]}>
                      <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />}
                        placeholder="Repite la contraseña" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Form.Item name="acepta_terminos" valuePropName="checked"
                  rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject('Debes aceptar los términos') }]}>
                  <Checkbox>
                    Acepto que mis datos sean utilizados por la FMRE para la gestión de mi membresía,
                    en cumplimiento con la Ley Federal de Protección de Datos Personales.
                  </Checkbox>
                </Form.Item>
                <Form.Item name="acepta_boletin" valuePropName="checked">
                  <Checkbox>
                    Deseo recibir el Boletín Dominical de la FMRE en mi correo electrónico.
                  </Checkbox>
                </Form.Item>

                <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#874d00' }}>
                    <strong>Nota:</strong> Este es un pre-registro. Tu cuenta será activada una vez que un
                    administrador valide tus documentos y confirme el pago de la membresía.
                    Recibirás un correo de confirmación en <strong>{form.getFieldValue('email') || 'tu correo'}</strong>.
                  </p>
                </div>
              </>
            )}

          </Form>

          {/* Botones de navegación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
            {current > 0
              ? <Button icon={<ArrowLeftOutlined />} onClick={prev} size="large">Anterior</Button>
              : <Button onClick={onClose} size="large">Cancelar</Button>
            }
            {current < STEPS.length - 1
              ? <Button type="primary" size="large" onClick={next}
                  style={{ background: FMRE_BLUE, borderColor: FMRE_BLUE }}
                  icon={<ArrowRightOutlined />} iconPosition="end">
                  Siguiente
                </Button>
              : <Button type="primary" size="large" loading={loading} onClick={handleSubmit}
                  style={{ background: '#389e0d', borderColor: '#389e0d' }}
                  icon={<GlobalOutlined />}>
                  Enviar Pre-registro
                </Button>
            }
          </div>

          {/* Indicador de paso */}
          <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 16, marginBottom: 0 }}>
            Paso {current + 1} de {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  )
}
