const rawMock = String(import.meta.env.VITE_USE_MOCK ?? 'false').toLowerCase()
export const USE_MOCK = rawMock === 'true' || rawMock === '1'

const rawStockTransferApi = String(import.meta.env.VITE_ENABLE_STOCK_TRANSFER_API ?? 'true').toLowerCase()
export const ENABLE_STOCK_TRANSFER_API = rawStockTransferApi === 'true' || rawStockTransferApi === '1'

export const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083'

// export const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL || 'https://grandinventory.com/api/'

