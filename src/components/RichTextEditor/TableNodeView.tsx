import { useRef, useState } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const FMRE_BLUE = '#1A569E'
const HANDLE_W  = 8

export default function TableNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; w: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dispW, setDispW]       = useState<number | null>(null)

  const tableWidth = node.attrs.tableWidth ?? null

  const onMouseDown = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    if (!wrapRef.current) return

    const rect = wrapRef.current.getBoundingClientRect()
    const dir  = side === 'right' ? 1 : -1
    startRef.current = { x: e.clientX, w: rect.width }
    setDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!startRef.current) return
      const dx   = (ev.clientX - startRef.current.x) * dir
      const newW = Math.max(100, Math.round(startRef.current.w + dx))
      setDispW(newW)
      updateAttributes({ tableWidth: newW })
    }

    const onUp = () => {
      startRef.current = null
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  const showHandles = selected || dragging

  return (
    <NodeViewWrapper style={{ display: 'block', position: 'relative', marginBottom: 16 }}>
      {/* Handle izquierdo */}
      {showHandles && (
        <div
          onMouseDown={e => onMouseDown(e, 'left')}
          style={{
            position: 'absolute', left: -HANDLE_W - 2, top: '50%',
            transform: 'translateY(-50%)',
            width: HANDLE_W, height: 40,
            background: FMRE_BLUE, borderRadius: 4,
            cursor: 'ew-resize', zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
        </div>
      )}

      {/* Tabla */}
      <div
        ref={wrapRef}
        style={{
          width:    tableWidth ? `${tableWidth}px` : '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          outline:  showHandles ? `2px solid ${FMRE_BLUE}` : 'none',
          borderRadius: 2,
          cursor:   dragging ? 'ew-resize' : 'default',
          transition: 'outline 0.1s',
        }}
      >
        <NodeViewContent as="table" style={{ width: '100%', borderCollapse: 'collapse' }} />
      </div>

      {/* Handle derecho */}
      {showHandles && (
        <div
          onMouseDown={e => onMouseDown(e, 'right')}
          style={{
            position: 'absolute', right: -HANDLE_W - 2, top: '50%',
            transform: 'translateY(-50%)',
            width: HANDLE_W, height: 40,
            background: FMRE_BLUE, borderRadius: 4,
            cursor: 'ew-resize', zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
        </div>
      )}

      {/* Indicador de ancho */}
      {showHandles && (dispW ?? tableWidth) && (
        <div style={{
          position:  'absolute',
          bottom:    -22,
          left:      '50%',
          transform: 'translateX(-50%)',
          background: FMRE_BLUE,
          color:     'white',
          padding:   '2px 8px',
          borderRadius: 4,
          fontSize:  11,
          whiteSpace: 'nowrap',
          zIndex:    20,
          pointerEvents: 'none',
        }}>
          {dispW ?? tableWidth}px
        </div>
      )}
    </NodeViewWrapper>
  )
}
