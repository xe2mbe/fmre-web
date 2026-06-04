const express    = require('express')
const cors       = require('cors')
const nodemailer = require('nodemailer')
const jwt        = require('jsonwebtoken')
const crypto     = require('crypto')
const Database   = require('better-sqlite3')
const path       = require('path')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Base de datos SQLite ──────────────────────────────────────────────────────

const db = new Database(path.join(__dirname, 'fmre.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS plantillas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT    NOT NULL,
    descripcion      TEXT    NOT NULL DEFAULT '',
    -- Tipografía
    fuente_titulo    TEXT    NOT NULL DEFAULT 'Arial, sans-serif',
    tamano_titulo    TEXT    NOT NULL DEFAULT '16',
    fuente_cuerpo    TEXT    NOT NULL DEFAULT 'Arial, sans-serif',
    tamano_cuerpo    TEXT    NOT NULL DEFAULT '12',
    -- Encabezado
    enc_contenido    TEXT    NOT NULL DEFAULT '',
    enc_fuente       TEXT    NOT NULL DEFAULT 'Arial, sans-serif',
    enc_tamano       TEXT    NOT NULL DEFAULT '10',
    enc_paginas      TEXT    NOT NULL DEFAULT 'todas',
    -- Pie de página
    pie_contenido    TEXT    NOT NULL DEFAULT '',
    pie_fuente       TEXT    NOT NULL DEFAULT 'Arial, sans-serif',
    pie_tamano       TEXT    NOT NULL DEFAULT '10',
    pie_paginas      TEXT    NOT NULL DEFAULT 'todas',
    -- Número de página
    num_pagina       INTEGER NOT NULL DEFAULT 0,
    num_pagina_pos   TEXT    NOT NULL DEFAULT 'centro',
    num_pagina_fmt   TEXT    NOT NULL DEFAULT 'X',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS secciones_plantilla (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    plantilla_id   INTEGER NOT NULL REFERENCES plantillas(id) ON DELETE CASCADE,
    nombre         TEXT    NOT NULL,
    tipo           TEXT    NOT NULL CHECK(tipo IN ('estatica','dinamica','temporal')),
    fuente_titulo  TEXT    NOT NULL DEFAULT 'Arial, sans-serif',
    tamano_titulo  TEXT    NOT NULL DEFAULT '16',
    fuente_cuerpo  TEXT    NOT NULL DEFAULT 'Arial, sans-serif',
    tamano_cuerpo  TEXT    NOT NULL DEFAULT '12',
    contenido      TEXT    NOT NULL DEFAULT '',
    orden          INTEGER NOT NULL DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Migración: agregar columnas a plantillas si ya existía con esquema viejo
;[
  "fuente_titulo TEXT NOT NULL DEFAULT 'Arial, sans-serif'",
  "tamano_titulo TEXT NOT NULL DEFAULT '16'",
  "fuente_cuerpo TEXT NOT NULL DEFAULT 'Arial, sans-serif'",
  "tamano_cuerpo TEXT NOT NULL DEFAULT '12'",
  "enc_contenido  TEXT NOT NULL DEFAULT ''",
  "enc_fuente     TEXT NOT NULL DEFAULT 'Arial, sans-serif'",
  "enc_tamano     TEXT NOT NULL DEFAULT '10'",
  "enc_paginas    TEXT NOT NULL DEFAULT 'todas'",
  "pie_contenido  TEXT NOT NULL DEFAULT ''",
  "pie_fuente     TEXT NOT NULL DEFAULT 'Arial, sans-serif'",
  "pie_tamano     TEXT NOT NULL DEFAULT '10'",
  "pie_paginas    TEXT NOT NULL DEFAULT 'todas'",
  "num_pagina     INTEGER NOT NULL DEFAULT 0",
  "num_pagina_pos TEXT NOT NULL DEFAULT 'centro'",
  "num_pagina_fmt TEXT NOT NULL DEFAULT 'X'",
].forEach(col => {
  try { db.exec(`ALTER TABLE plantillas ADD COLUMN ${col}`) } catch {}
})

app.use(cors())
app.use(express.json())

// ── SMTP ─────────────────────────────────────────────────────────────────────

const smtpTransport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SSL === 'true',   // true = 465, false = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER

// ── OTP store (en memoria) ───────────────────────────────────────────────────
// { email -> { codigo, expira, datos } }
const otpStore = new Map()

// ── Helpers ───────────────────────────────────────────────────────────────────

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function htmlCodigo(nombre, codigo) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;
              background:#f7f8fa;border-radius:12px">
    <div style="text-align:center;margin-bottom:24px">
      <img src="https://299085.nodes.allstarlink.org/LogoFMRE.png" height="60" alt="FMRE"/>
      <h2 style="color:#0D2E5F;margin:12px 0 0">Federación Mexicana de Radioexperimentadores, A.C.</h2>
    </div>
    <p style="color:#333">Hola <strong>${nombre}</strong>,</p>
    <p style="color:#555">Gracias por iniciar tu pre-registro de membresía en la FMRE.
    Para verificar tu correo electrónico, ingresa el siguiente código en el formulario:</p>
    <div style="background:#0D2E5F;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <span style="color:#D4A017;font-size:42px;font-weight:900;letter-spacing:10px">${codigo}</span>
      <p style="color:#8ab4e0;margin:8px 0 0;font-size:13px">Este código es válido por 15 minutos</p>
    </div>
    <p style="color:#888;font-size:12px">Si no solicitaste este registro, ignora este mensaje.</p>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0"/>
    <p style="color:#aaa;font-size:11px;text-align:center">
      FMRE · Federación Mexicana de Radioexperimentadores, A.C. · 73 de XE
    </p>
  </div>`
}

function htmlBienvenida(nombre, email, passwordTemp, indicativo) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;
              background:#f7f8fa;border-radius:12px">
    <div style="text-align:center;margin-bottom:24px">
      <img src="https://299085.nodes.allstarlink.org/LogoFMRE.png" height="60" alt="FMRE"/>
      <h2 style="color:#0D2E5F;margin:12px 0 0">¡Bienvenido a la FMRE!</h2>
    </div>
    <p style="color:#333">Hola <strong>${nombre}</strong>,</p>
    <p style="color:#555">Tu pre-registro ha sido confirmado. Tu cuenta ha sido creada con acceso
    provisional al portal mientras se validan tus documentos y pago de membresía.</p>
    <div style="background:#f0f5ff;border:1px solid #adc6ff;border-radius:10px;padding:20px;margin:20px 0">
      <p style="margin:0 0 8px;color:#1A569E;font-weight:700">Datos de acceso al portal:</p>
      <p style="margin:4px 0;color:#333"><strong>Usuario:</strong> ${email}</p>
      <p style="margin:4px 0;color:#333"><strong>Contraseña temporal:</strong>
        <span style="font-family:monospace;background:#e6f0ff;padding:2px 8px;
                     border-radius:4px;font-size:16px">${passwordTemp}</span>
      </p>
      ${indicativo ? `<p style="margin:4px 0;color:#333"><strong>Indicativo:</strong> ${indicativo}</p>` : ''}
    </div>
    <p style="color:#d48806;font-size:13px">
      ⚠️ Te recomendamos cambiar esta contraseña en tu primer inicio de sesión.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://299085.nodes.allstarlink.org/login"
         style="background:#1A569E;color:white;padding:12px 32px;border-radius:8px;
                text-decoration:none;font-weight:700;font-size:15px">
        Acceder al Portal FMRE
      </a>
    </div>
    <p style="color:#888;font-size:12px">
      Tu solicitud será revisada por un administrador. Recibirás confirmación cuando
      tu membresía sea activada.
    </p>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0"/>
    <p style="color:#aaa;font-size:11px;text-align:center">
      FMRE · Federación Mexicana de Radioexperimentadores, A.C. · 73 de XE
    </p>
  </div>`
}

function generarPasswordTemporal() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

app.post('/api/auth/pre-registro', async (req, res) => {
  const { email, nombre, primer_apellido } = req.body
  if (!email) return res.status(400).json({ detail: 'Email requerido' })

  const codigo = generarCodigo()
  const expira = Date.now() + 15 * 60 * 1000

  otpStore.set(email.toLowerCase(), { codigo, expira, datos: req.body })

  const nombre_completo = `${nombre || ''} ${primer_apellido || ''}`.trim()

  try {
    await smtpTransport.sendMail({
      from: `"FMRE" <${SMTP_FROM}>`,
      to: email,
      subject: 'FMRE — Código de verificación para tu pre-registro',
      html: htmlCodigo(nombre_completo, codigo),
    })
  } catch (err) {
    console.error('SMTP error:', err.message)
    return res.status(500).json({ detail: `No se pudo enviar el correo: ${err.message}` })
  }

  console.log(`[pre-registro] Código ${codigo} enviado a ${email}`)
  return res.json({ ok: true, email, mensaje: `Código enviado a ${email}. Válido por 15 minutos.` })
})


app.post('/api/auth/verificar-registro', async (req, res) => {
  const { email, codigo } = req.body
  if (!email || !codigo) return res.status(400).json({ detail: 'Email y código requeridos' })

  const entry = otpStore.get(email.toLowerCase())
  if (!entry) return res.status(404).json({ detail: 'No se encontró un pre-registro para este correo' })
  if (Date.now() > entry.expira) {
    otpStore.delete(email.toLowerCase())
    return res.status(400).json({ detail: 'El código ha expirado. Solicita uno nuevo.' })
  }
  if (entry.codigo !== codigo.trim()) {
    return res.status(400).json({ detail: 'Código incorrecto' })
  }

  otpStore.delete(email.toLowerCase())

  const datos = entry.datos
  const nombre_completo = `${datos.nombre || ''} ${datos.primer_apellido || ''} ${datos.segundo_apellido || ''}`.trim()
  const indicativo = (datos.indicativo || '').toUpperCase()
  const passwordTemp = generarPasswordTemporal()

  console.log(`[verificar-registro] Cuenta creada para ${email} — password temporal: ${passwordTemp}`)

  try {
    await smtpTransport.sendMail({
      from: `"FMRE" <${SMTP_FROM}>`,
      to: email,
      subject: 'FMRE — Bienvenido al portal, tus datos de acceso',
      html: htmlBienvenida(nombre_completo, email, passwordTemp, indicativo),
    })
  } catch (err) {
    console.error('SMTP bienvenida error:', err.message)
    // La cuenta "se creó" — el correo es opcional aquí
  }

  return res.json({ ok: true, mensaje: 'Cuenta creada. Revisa tu correo con los datos de acceso.' })
})


// ── Auth — store local ────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'fmre-secret'

function hashPass(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex')
}

// Usuarios en memoria — clave: email en minúsculas
const USUARIOS = new Map([
  ['admin@fmre.org', {
    email:      'admin@fmre.org',
    nombre:     'Administrador FMRE',
    rol:        'administrador',
    indicativo: null,
    passHash:   hashPass('Admin1234!'),
  }],
])

function issueToken(usuario) {
  const { email, nombre, rol, indicativo } = usuario
  return jwt.sign({ email, nombre, rol, indicativo }, JWT_SECRET, { expiresIn: '8h' })
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ detail: 'Email y contraseña requeridos' })

  const u = USUARIOS.get(email.toLowerCase().trim())
  if (!u || u.passHash !== hashPass(password))
    return res.status(401).json({ detail: 'Credenciales incorrectas' })

  const token = issueToken(u)
  console.log(`[login] ${email} → ${u.rol}`)
  return res.json({ token, usuario: { email: u.email, nombre: u.nombre, rol: u.rol, indicativo: u.indicativo } })
})

app.get('/api/auth/me', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ detail: 'Sin token' })
  try {
    const p = jwt.verify(token, JWT_SECRET)
    return res.json({ email: p.email, nombre: p.nombre, rol: p.rol, indicativo: p.indicativo })
  } catch {
    return res.status(401).json({ detail: 'Token inválido o expirado' })
  }
})

// ── Plantillas ────────────────────────────────────────────────────────────────

app.get('/api/plantillas/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM plantillas WHERE id = ?').get(req.params.id)
  if (!p) return res.status(404).json({ detail: 'Plantilla no encontrada' })
  res.json(p)
})

app.get('/api/plantillas', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, COUNT(s.id) AS total_secciones
    FROM plantillas p
    LEFT JOIN secciones_plantilla s ON s.plantilla_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC
  `).all()
  res.json(rows)
})

function extractPlantilla(body) {
  return {
    nombre:        body.nombre?.trim() ?? '',
    descripcion:   body.descripcion   ?? '',
    fuente_titulo: body.fuente_titulo ?? 'Arial, sans-serif',
    tamano_titulo: body.tamano_titulo ?? '16',
    fuente_cuerpo: body.fuente_cuerpo ?? 'Arial, sans-serif',
    tamano_cuerpo: body.tamano_cuerpo ?? '12',
    enc_contenido: body.enc_contenido ?? '',
    enc_fuente:    body.enc_fuente    ?? 'Arial, sans-serif',
    enc_tamano:    body.enc_tamano    ?? '10',
    enc_paginas:   body.enc_paginas   ?? 'todas',
    pie_contenido: body.pie_contenido ?? '',
    pie_fuente:    body.pie_fuente    ?? 'Arial, sans-serif',
    pie_tamano:    body.pie_tamano    ?? '10',
    pie_paginas:   body.pie_paginas   ?? 'todas',
    num_pagina:    body.num_pagina    ? 1 : 0,
    num_pagina_pos:body.num_pagina_pos?? 'centro',
    num_pagina_fmt:body.num_pagina_fmt?? 'X',
  }
}

app.post('/api/plantillas', (req, res) => {
  const p = extractPlantilla(req.body)
  if (!p.nombre) return res.status(400).json({ detail: 'El nombre es requerido' })
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO plantillas
      (nombre, descripcion, fuente_titulo, tamano_titulo, fuente_cuerpo, tamano_cuerpo,
       enc_contenido, enc_fuente, enc_tamano, enc_paginas,
       pie_contenido, pie_fuente, pie_tamano, pie_paginas,
       num_pagina, num_pagina_pos, num_pagina_fmt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(p.nombre, p.descripcion, p.fuente_titulo, p.tamano_titulo, p.fuente_cuerpo, p.tamano_cuerpo,
         p.enc_contenido, p.enc_fuente, p.enc_tamano, p.enc_paginas,
         p.pie_contenido, p.pie_fuente, p.pie_tamano, p.pie_paginas,
         p.num_pagina, p.num_pagina_pos, p.num_pagina_fmt)
  res.status(201).json(db.prepare('SELECT * FROM plantillas WHERE id = ?').get(lastInsertRowid))
})

app.put('/api/plantillas/:id', (req, res) => {
  const p = extractPlantilla(req.body)
  if (!p.nombre) return res.status(400).json({ detail: 'El nombre es requerido' })
  const { changes } = db.prepare(`
    UPDATE plantillas SET
      nombre=?, descripcion=?, fuente_titulo=?, tamano_titulo=?, fuente_cuerpo=?, tamano_cuerpo=?,
      enc_contenido=?, enc_fuente=?, enc_tamano=?, enc_paginas=?,
      pie_contenido=?, pie_fuente=?, pie_tamano=?, pie_paginas=?,
      num_pagina=?, num_pagina_pos=?, num_pagina_fmt=?,
      updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(p.nombre, p.descripcion, p.fuente_titulo, p.tamano_titulo, p.fuente_cuerpo, p.tamano_cuerpo,
         p.enc_contenido, p.enc_fuente, p.enc_tamano, p.enc_paginas,
         p.pie_contenido, p.pie_fuente, p.pie_tamano, p.pie_paginas,
         p.num_pagina, p.num_pagina_pos, p.num_pagina_fmt,
         req.params.id)
  if (!changes) return res.status(404).json({ detail: 'Plantilla no encontrada' })
  res.json(db.prepare('SELECT * FROM plantillas WHERE id = ?').get(req.params.id))
})

app.delete('/api/plantillas/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM plantillas WHERE id = ?').run(req.params.id)
  if (!changes) return res.status(404).json({ detail: 'Plantilla no encontrada' })
  res.json({ ok: true })
})

// ── Secciones de plantilla ────────────────────────────────────────────────────

app.get('/api/plantillas/:id/secciones', (req, res) => {
  const secciones = db.prepare(
    'SELECT * FROM secciones_plantilla WHERE plantilla_id = ? ORDER BY orden, id'
  ).all(req.params.id)
  res.json(secciones)
})

app.post('/api/plantillas/:id/secciones', (req, res) => {
  const { nombre, tipo, contenido = '' } = req.body
  if (!nombre?.trim()) return res.status(400).json({ detail: 'El nombre es requerido' })
  if (!['estatica', 'dinamica', 'temporal'].includes(tipo))
    return res.status(400).json({ detail: 'Tipo inválido' })

  const maxOrden = db.prepare(
    'SELECT COALESCE(MAX(orden), -1) as m FROM secciones_plantilla WHERE plantilla_id = ?'
  ).get(req.params.id).m

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO secciones_plantilla (plantilla_id, nombre, tipo, contenido, orden)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, nombre.trim(), tipo, contenido, maxOrden + 1)

  res.status(201).json(
    db.prepare('SELECT * FROM secciones_plantilla WHERE id = ?').get(lastInsertRowid)
  )
})

app.put('/api/secciones/:id', (req, res) => {
  const { nombre, tipo, contenido } = req.body
  if (!nombre?.trim()) return res.status(400).json({ detail: 'El nombre es requerido' })
  if (!['estatica', 'dinamica', 'temporal'].includes(tipo))
    return res.status(400).json({ detail: 'Tipo inválido' })

  const { changes } = db.prepare(`
    UPDATE secciones_plantilla
    SET nombre=?, tipo=?, contenido=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(nombre.trim(), tipo, contenido ?? '', req.params.id)

  if (!changes) return res.status(404).json({ detail: 'Sección no encontrada' })
  res.json(db.prepare('SELECT * FROM secciones_plantilla WHERE id = ?').get(req.params.id))
})

app.delete('/api/secciones/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM secciones_plantilla WHERE id = ?').run(req.params.id)
  if (!changes) return res.status(404).json({ detail: 'Sección no encontrada' })
  res.json({ ok: true })
})

app.patch('/api/secciones/:id/orden', (req, res) => {
  const { orden } = req.body
  db.prepare('UPDATE secciones_plantilla SET orden=? WHERE id=?').run(orden, req.params.id)
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`fmre-api corriendo en http://localhost:${PORT}`)
})
