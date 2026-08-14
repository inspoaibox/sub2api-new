import { beforeEach, describe, expect, it, vi } from 'vitest'

const toDataURL = vi.hoisted(() => vi.fn())

vi.mock('qrcode', () => ({
  default: { toDataURL },
}))

import { resolveStripeWechatQrImage } from '../stripeWechatQr'

describe('resolveStripeWechatQrImage', () => {
  beforeEach(() => {
    toDataURL.mockReset().mockResolvedValue('data:image/png;base64,sharp-qr')
  })

  it('regenerates a high-resolution QR image from Stripe raw data', async () => {
    await expect(resolveStripeWechatQrImage({
      data: 'weixin://wxpay/test',
      image_data_url: 'data:image/png;base64,stripe-fallback',
    })).resolves.toBe('data:image/png;base64,sharp-qr')

    expect(toDataURL).toHaveBeenCalledWith('weixin://wxpay/test', expect.objectContaining({
      width: 320,
      margin: 4,
      errorCorrectionLevel: 'M',
    }))
  })

  it('falls back to Stripe assets when raw data is unavailable', async () => {
    await expect(resolveStripeWechatQrImage({
      image_url_svg: 'https://stripe.example/qr.svg',
      image_data_url: 'data:image/png;base64,stripe-fallback',
    })).resolves.toBe('https://stripe.example/qr.svg')

    expect(toDataURL).not.toHaveBeenCalled()
  })
})
