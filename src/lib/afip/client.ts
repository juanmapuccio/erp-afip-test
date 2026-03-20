import Afip from '@afipsdk/afip.js'

export function createAfipClient(cuit?: number) {
  const isSandbox = process.env.AFIP_ENV !== 'production'

  if (!process.env.AFIP_ACCESS_TOKEN) {
    throw new Error('AFIP_ACCESS_TOKEN no configurado')
  }

  const effectiveCuit = isSandbox
    ? Number(process.env.AFIP_TEST_CUIT)
    : (cuit ?? Number(process.env.AFIP_TEST_CUIT))

  return new Afip({
    access_token: process.env.AFIP_ACCESS_TOKEN,
    CUIT:         effectiveCuit,
    production:   !isSandbox,
  })
}
