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
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const url = sigRef.current.toDataURL('image/png')
      setDataUrl(url)
    }
  }, [])

  const handleClear = useCallback(() => {
    if (sigRef.current) {
      sigRef.current.clear()
      setDataUrl(null)
      onClear?.()
    }
  }, [onClear])

  const handleSave = useCallback(() => {
    if (dataUrl) {
      onSave(dataUrl)
    } else if (sigRef.current && !sigRef.current.isEmpty()) {
      const url = sigRef.current.toDataURL('image/png')
      setDataUrl(url)
      onSave(url)
    } else {
      alert('Veuillez signer avant de valider')
    }
  }, [dataUrl, onSave])

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
          onEnd={handleEnd}
        />
      </div>
      {dataUrl && (
        <p className="text-xs text-green-600">✓ Signature enregistrée — cliquez sur Valider</p>
      )}
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
          className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
            dataUrl ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {dataUrl ? '✓ Valider la signature' : 'Valider la signature'}
        </button>
      </div>
    </div>
  )
}
