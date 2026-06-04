import { useRef, useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const HANDLE_SIZE = 10
const FMRE_BLUE   = '#1A569E'

const HANDLES = [
  { id: 'se', style: { right: -HANDLE_SIZE/2, bottom: -HANDLE_SIZE/2, cursor: 'se-resize' } },
  { id: 'sw', style: { left:  -HANDLE_SIZE/2, bottom: -HANDLE_SIZE/2, cursor: 'sw-resize' } },
  { id: 'ne', style: { right: -HANDLE_SIZE/2, top:    -HANDLE_SIZE/2, cursor: 'ne-resize' } },
  { id: 'nw', style: { left:  -HANDLE_SIZE/2, top:    -HANDLE_SIZE/2, cursor: 'nw-resize' } },
  { id: 'e',  style: { right: -HANDLE_SIZE/2, top: '50%', marginTop: -HANDLE_SIZE/2, cursor: 'e-resize' } },
  { id: 'w',  style: { left:  -HANDLE_SIZE/2, top: '50%', marginTop: -HANDLE_SIZE/2, cursor: 'w-resize' } },
] as const

export default function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef   = useRef<HTMLImageElement>(null)
  const startRef = useRef<{ x: number; w: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dispW, setDispW]       = useState<number | null>(null)

  // Sync displayed width on selection
  useEffect(() => {
    if (selected && imgRef.current) setDispW(imgRef.current.offsetWidth)
  }, [selected, node.attrs.width])

  const onMouseDown = (e: React.MouseEvent, handleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!imgRef.current) return

    const rect = imgRef.current.getBoundingClientRect()
    const dir  = handleId.includes('e') ? 1 : -1  // east = grows right, west = grows left
    startRef.current = { x: e.clientX, w: rect.width }
    setDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!startRef.current) return
      const dx     = (ev.clientX - startRef.current.x) * dir
      const newW   = Math.max(40, Math.round(startRef.current.w + dx))
      setDispW(newW)
      updateAttributes({ width: newW })
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

  const { src, alt, width } = node.attrs

  return (
    <NodeViewWrapper
      style={{ display: 'inline-block', position: 'relative', lineHeight: 0 }}
      data-drag-handle
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        width={width || undefined}
        draggable={false}
        style={{
          display:   'block',
          maxWidth:  '100%',
          height:    'auto',
          borderRadius: 4,
          outline:   selected ? `2px solid ${FMRE_BLUE}` : 'none',
          userSelect: 'none',
          cursor:    dragging ? 'col-resize' : 'default',
        }}
      />

      {/* Handles de redimensionado */}
      {selected && HANDLES.map(h => (
        <div
          key={h.id}
          onMouseDown={e => onMouseDown(e, h.id)}
          style={{
            position:  'absolute',
            width:     HANDLE_SIZE,
            height:    HANDLE_SIZE,
            background: FMRE_BLUE,
            border:    '2px solid white',
            borderRadius: 2,
            zIndex:    20,
            cursor:    h.style.cursor,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            ...h.style,
          }}
        />
      ))}

      {/* Indicador de dimensiones */}
      {selected && dispW && (
        <div style={{
          position:   'absolute',
          bottom:     -26,
          left:       '50%',
          transform:  'translateX(-50%)',
          background: FMRE_BLUE,
          color:      'white',
          padding:    '2px 8px',
          borderRadius: 4,
          fontSize:   11,
          whiteSpace: 'nowrap',
          zIndex:     20,
          pointerEvents: 'none',
        }}>
          {dispW}px
        </div>
      )}
    </NodeViewWrapper>
  )
}
