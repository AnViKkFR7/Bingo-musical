import { useEffect, useRef } from 'react'

interface AdSlotProps {
  slotId: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
}

const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true'
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined

export function AdSlot({ slotId, format = 'auto', className }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!ADS_ENABLED || !slotId || initialized.current) return
    initialized.current = true

    try {
      // @ts-expect-error — adsbygoogle es inyectado por el script externo de AdSense
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // silenciar errores si AdSense no está disponible
    }
  }, [slotId])

  // Si los anuncios están desactivados, no renderiza nada visible
  if (!ADS_ENABLED) {
    return <div style={{ display: 'none' }} aria-hidden="true" />
  }

  return (
    <div ref={ref} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
