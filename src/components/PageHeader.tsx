import { ReactNode } from 'react'
import Link from 'next/link'
interface P { title: string; subtitle?: string; action?: ReactNode; backHref?: string }
export default function PageHeader({ title, subtitle, action, backHref }: P) {
  return (
    <div className="mb-6">
      {backHref && <Link href={backHref} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Retour</Link>}
      <div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold text-gray-900">{title}</h1>{subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}</div>{action && <div>{action}</div>}</div>
    </div>
  )
}