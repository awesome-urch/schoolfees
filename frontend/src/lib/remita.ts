// Remita Payment Gateway inline checkout helper.
// Loads remita-pay-inline.bundle.js and opens the hosted payment widget.

export interface RemitaInlineConfig {
  scriptUrl: string
  key: string
  transactionId: string
  customerId?: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  amount: number
  currency?: string
  narration: string
}

declare global {
  interface Window {
    RmPaymentEngine?: {
      init: (options: Record<string, unknown>) => { showPaymentWidget: () => void }
    }
  }
}

const loaded: Record<string, Promise<void>> = {}

export function loadRemitaScript(src: string): Promise<void> {
  if (window.RmPaymentEngine) return Promise.resolve()
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        delete loaded[src]
        reject(new Error('Failed to load Remita checkout'))
      }
      document.body.appendChild(script)
    })
  }
  return loaded[src]
}

export async function openRemitaCheckout(
  config: RemitaInlineConfig,
  handlers: {
    onSuccess: (response: any) => void
    onError?: (response: any) => void
    onClose?: () => void
  }
) {
  await loadRemitaScript(config.scriptUrl)
  if (!window.RmPaymentEngine) throw new Error('Remita checkout is unavailable')

  const { scriptUrl, ...options } = config
  window.RmPaymentEngine
    .init({
      ...options,
      onSuccess: handlers.onSuccess,
      onError: handlers.onError || (() => {}),
      onClose: handlers.onClose || (() => {}),
    })
    .showPaymentWidget()
}
