'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useState } from 'react'

const SignatureCanvasLib = dynamic(() => import('react-signature-canvas'), { ssr: false }) as any

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  onClear?: () => void
}

export default function SignatureCanvas({ onSave, onClear }: SignatureCanvasProps) {
  const sigRef = useRef<any>(null)
  const [saved, setSaved] = useState(false)

  const handleClear = useCallback(() => {
    if (sigRef.current) {
      sigRef.current.clear()
      setSaved(false)
      onClear?.()
    }
  }, [onClear])

  const handleSave = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png')
      onSave(dataUrl)
      setSaved(true)
    } else {
      alert('Veuillez signer avant de valider')
    }
  }, [onSave])

  return (
    <div className="space-y-2">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <SignatureCanvasLib
          ref={sigRef}
          canvasProps={{
            className: 'w-full h-40',
            style: { width: '100%', height: '160px' }
          }}
          backgroundColor="white"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? '✓ Signature validée' : 'Valider la signature'}
        </button>
      </div>
    </div>
  )
}
