'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  onClear?: () => void
}

export default function SignatureCanvas({ onSave, onClear }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasSigned = useRef(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    drawing.current = true
    hasSigned.current = true
    setSaved(false)
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = false
  }

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hasSigned.current = false
    setSaved(false)
    onClear?.()
  }, [onClear])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasSigned.current) {
      alert('Veuillez signer avant de valider')
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
    setSaved(true)
  }, [onSave])

  return (
    <div className="space-y-2">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          style={{ width: '100%', height: '160px', display: 'block', cursor: 'crosshair' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={handleClear}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
          Effacer
        </button>
        <button type="button" onClick={handleSave}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          {saved ? '✓ Signature validée' : 'Valider la signature'}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">✓ Vous pouvez valider</span>}
      </div>
    </div>
  )
}
