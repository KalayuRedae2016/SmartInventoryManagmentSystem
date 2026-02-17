const rawMock = String(import.meta.env.VITE_USE_MOCK ?? 'false').toLowerCase()
export const USE_MOCK = rawMock === 'true' || rawMock === '1'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://grandinventory.com/api/'
