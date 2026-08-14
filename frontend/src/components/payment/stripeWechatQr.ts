import QRCode from 'qrcode'

export interface StripeWechatQrCode {
  data?: string
  image_data_url?: string
  image_url_png?: string
  image_url_svg?: string
}

/** Prefer Stripe's raw payload so the browser can render a crisp local QR image. */
export async function resolveStripeWechatQrImage(qrCode?: StripeWechatQrCode): Promise<string> {
  const rawData = qrCode?.data?.trim()
  if (rawData) {
    try {
      return await QRCode.toDataURL(rawData, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
    } catch {
      // Fall back to Stripe's generated assets if local QR rendering fails.
    }
  }

  return qrCode?.image_url_svg
    || qrCode?.image_url_png
    || qrCode?.image_data_url
    || ''
}
