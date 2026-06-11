'use client'
import dynamic from 'next/dynamic'
import { useRef, useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Sig = dynamic(() => import('react-signature-canvas'), { ssr: false }) as any
interface P { onSave: (d: string) => void; onClear?: () => void }
export default function SignatureCanvas({ onSave, onClear }: P) {
  const ref = useRef<any>(null)
  const clear = useCallback(() => { if (ref.current) { ref.current.clear(); onClear?.() } }, [onClear])
  const save = useCallback(() => { if (ref.current && !ref.current.isEmpty()) onSave(ref.current.toDataURL('image/png')) }, [onSave])
  return (
    <div className="space-y-2">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white"><Sig ref={ref} canvasProps={{ className: 'w-full h-40', style: { width: '100%', height: '160px' } }} backgroundColor="white" onEnd={save} /></div>
      <div className="flex gap-2">
        <button type="button" onClick={clear} className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Effacer</button>
        <button type="button" onClick={save} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Valider la signature</button>
      </div>
    </div>
  )
}