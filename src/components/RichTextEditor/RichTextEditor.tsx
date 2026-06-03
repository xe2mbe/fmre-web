import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Color } from '@tiptap/extension-color'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Tooltip, Modal, Input, Form } from 'antd'
import { useState, useEffect, useRef } from 'react'
import './RichTextEditor.css'

// ── Iconos SVG inline ─────────────────────────────────────────────────────────

const Icon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d={d} />
  </svg>
)

const ICONS = {
  bold:          'M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z',
  italic:        'M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z',
  underline:     'M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z',
  strike:        'M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z',
  h1:            'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H8v4H6V7h2v4h4V7h2v10z',
  h2:            'M3 17v2h6v-2H6c1.1-1.1 3-2 3-4 0-1.7-1.3-3-3-3s-3 1.3-3 3h2c0-.6.4-1 1-1s1 .4 1 1c0 1-2 2-4 4zm8-10v10h2V7h-2zm4 10h4v2h-4v-2zm0-3h3v2h-3v-2zm0-3h4v2h-4v-2zm0-4h4v2h-4V7z',
  h3:            'M11.07 12.85c.77-.31 1.43-.79 1.43-1.85 0-1.46-1.07-2.25-2.43-2.25-1.43 0-2.57.83-2.57 2.25h1.93c0-.67.5-1 .64-1 .49 0 .86.28.86.93 0 .55-.49.93-1.5.93v1.64c1.21 0 1.71.43 1.71 1.07 0 .64-.57.93-.86.93-.64 0-1.14-.38-1.14-1.07H7c0 1.79 1.29 2.36 2.71 2.36 1.5 0 2.86-.93 2.86-2.5 0-.93-.64-1.57-1.5-1.64zM14 7h2v10h-2V7z',
  alignL:        'M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z',
  alignC:        'M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z',
  alignR:        'M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z',
  alignJ:        'M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z',
  ul:            'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z',
  ol:            'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z',
  link:          'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  image:         'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  table:         'M20 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h15zm-7 14H5v-9h8v9zm7 0h-5v-9h5v9z',
  blockquote:    'M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z',
  highlight:     'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  sub:           'M22 18h-2v1h3v1h-4v-2c0-.55.45-1 1-1h2v-1h-3v-1h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1zM5.88 18h2.66l3.52-5.86h.08l3.52 5.86h2.66l-4.81-7.89L17.81 3h-2.67l-3.25 5.44h-.08L8.56 3H5.9l4.22 7.11L5.88 18z',
  sup:           'M22 7h-2v1h3v1h-4V7c0-.55.45-1 1-1h2V5h-3V4h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1zM5.88 20h2.66l3.52-5.86h.08l3.52 5.86h2.66l-4.81-7.89L17.81 5h-2.67l-3.25 5.44h-.08L8.56 5H5.9l4.22 7.11L5.88 20z',
  undo:          'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  redo:          'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z',
  clear:         'M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8H12.4l-.62 1.45 2.27 2.27L16.54 8H21V5H6z',
  hr:            'M19 13H5v-2h14v2z',
}

// ── Botón de toolbar ──────────────────────────────────────────────────────────

function Btn({ title, active, disabled, onClick, children }: {
  title: string; active?: boolean; disabled?: boolean
  onClick: () => void; children: React.ReactNode
}) {
  return (
    <Tooltip title={title} mouseEnterDelay={0.5}>
      <button
        className={`rte-btn${active ? ' active' : ''}`}
        disabled={disabled}
        onMouseDown={e => { e.preventDefault(); onClick() }}
      >
        {children}
      </button>
    </Tooltip>
  )
}

function Sep() { return <div className="rte-toolbar-sep" /> }

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  value?:       string
  onChange?:    (html: string) => void
  placeholder?: string
  minHeight?:   number
  fontFamily?:  string
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RichTextEditor({ value, onChange, placeholder = 'Escribe aquí...', minHeight = 220, fontFamily }: Props) {
  const [linkModal, setLinkModal]   = useState(false)
  const [imageModal, setImageModal] = useState(false)
  const [linkUrl, setLinkUrl]       = useState('')
  const [linkText, setLinkText]     = useState('')
  const [imageUrl, setImageUrl]     = useState('')
  const colorRef  = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Color,
      TextStyle,
      FontSize,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Subscript,
      Superscript,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  // Sincronizar valor externo
  useEffect(() => {
    if (!editor) return
    if (value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  if (!editor) return null

  const heading = editor.isActive('heading', { level: 1 }) ? '1'
    : editor.isActive('heading', { level: 2 }) ? '2'
    : editor.isActive('heading', { level: 3 }) ? '3' : '0'


  const insertLink = () => {
    if (!linkUrl) return
    if (linkText) {
      editor.chain().focus().insertContent(
        `<a href="${linkUrl}">${linkText}</a>`
      ).run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setLinkModal(false); setLinkUrl(''); setLinkText('')
  }

  const insertImage = () => {
    if (imageUrl) editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageModal(false); setImageUrl('')
  }

  return (
    <div style={{ fontFamily }}>
      {/* ── Toolbar ── */}
      <div className="rte-toolbar">

        {/* Deshacer / Rehacer */}
        <div className="rte-toolbar-group">
          <Btn title="Deshacer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Icon d={ICONS.undo} />
          </Btn>
          <Btn title="Rehacer (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Icon d={ICONS.redo} />
          </Btn>
        </div>

        <Sep />

        {/* Encabezados */}
        <div className="rte-toolbar-group">
          <Tooltip title="Estilo de párrafo" mouseEnterDelay={0.5}>
            <select className="rte-select" value={heading}
              onChange={e => {
                const v = e.target.value
                if (v === '0') editor.chain().focus().setParagraph().run()
                else editor.chain().focus().toggleHeading({ level: Number(v) as 1|2|3 }).run()
              }}>
              <option value="0">Párrafo</option>
              <option value="1">Título 1</option>
              <option value="2">Título 2</option>
              <option value="3">Título 3</option>
            </select>
          </Tooltip>
        </div>

        <Sep />

        {/* Formato básico */}
        <div className="rte-toolbar-group">
          <Btn title="Negrita (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Icon d={ICONS.bold} />
          </Btn>
          <Btn title="Cursiva (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Icon d={ICONS.italic} />
          </Btn>
          <Btn title="Subrayado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <Icon d={ICONS.underline} />
          </Btn>
          <Btn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Icon d={ICONS.strike} />
          </Btn>
          <Btn title="Subíndice" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
            <Icon d={ICONS.sub} />
          </Btn>
          <Btn title="Superíndice" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <Icon d={ICONS.sup} />
          </Btn>
        </div>

        <Sep />

        {/* Color de texto */}
        <div className="rte-toolbar-group">
          <Tooltip title="Color de texto" mouseEnterDelay={0.5}>
            <div className="rte-color-btn" onClick={() => colorRef.current?.click()}>
              <Icon d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" size={12} />
              <div style={{ width: 16, height: 3, background: editor.getAttributes('textStyle').color || '#000', borderRadius: 1 }} />
              <input ref={colorRef} type="color" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
            </div>
          </Tooltip>
          <Btn title="Resaltado" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <Icon d={ICONS.highlight} size={13} />
          </Btn>
        </div>

        <Sep />

        {/* Alineación */}
        <div className="rte-toolbar-group">
          <Btn title="Alinear izquierda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <Icon d={ICONS.alignL} />
          </Btn>
          <Btn title="Centrar" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <Icon d={ICONS.alignC} />
          </Btn>
          <Btn title="Alinear derecha" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <Icon d={ICONS.alignR} />
          </Btn>
          <Btn title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <Icon d={ICONS.alignJ} />
          </Btn>
        </div>

        <Sep />

        {/* Listas */}
        <div className="rte-toolbar-group">
          <Btn title="Lista con viñetas" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <Icon d={ICONS.ul} />
          </Btn>
          <Btn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <Icon d={ICONS.ol} />
          </Btn>
          <Btn title="Cita" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Icon d={ICONS.blockquote} />
          </Btn>
        </div>

        <Sep />

        {/* Insertar */}
        <div className="rte-toolbar-group">
          <Btn title="Insertar enlace" active={editor.isActive('link')} onClick={() => {
            setLinkUrl(editor.getAttributes('link').href || '')
            setLinkText('')
            setLinkModal(true)
          }}>
            <Icon d={ICONS.link} />
          </Btn>
          <Btn title="Insertar imagen" onClick={() => { setImageUrl(''); setImageModal(true) }}>
            <Icon d={ICONS.image} />
          </Btn>
          <Btn title="Insertar tabla" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <Icon d={ICONS.table} />
          </Btn>
          <Btn title="Línea horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Icon d={ICONS.hr} />
          </Btn>
        </div>

        <Sep />

        {/* Limpiar */}
        <div className="rte-toolbar-group">
          <Btn title="Limpiar formato" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <Icon d={ICONS.clear} />
          </Btn>
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="rte-content" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* ── Modal: Enlace ── */}
      <Modal title="Insertar enlace" open={linkModal}
        onOk={insertLink} onCancel={() => setLinkModal(false)} okText="Insertar">
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="URL">
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..." autoFocus />
          </Form.Item>
          <Form.Item label="Texto del enlace (opcional)">
            <Input value={linkText} onChange={e => setLinkText(e.target.value)}
              placeholder="Dejar vacío para usar el texto seleccionado" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal: Imagen ── */}
      <Modal title="Insertar imagen" open={imageModal}
        onOk={insertImage} onCancel={() => setImageModal(false)} okText="Insertar">
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="URL de la imagen">
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
