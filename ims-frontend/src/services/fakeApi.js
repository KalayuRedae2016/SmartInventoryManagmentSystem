// src/services/fakeApi.js
const DELAY = 250

function sleep(ms = DELAY) {
  return new Promise(res => setTimeout(res, ms))
}

function read(key) {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}
function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function ensureSeed() {
  if (!read('categories')) {
    write('categories', [
      { id: 1, name: 'Electronics', description: 'Electronic items' },
      { id: 2, name: 'Food', description: 'Grocery items' }
    ])
  }
  if (!read('products')) {
    write('products', [
      { id: 1, name: 'Laptop', categoryId: 1, category: 'Electronics', price: 850, quantity: 12 },
      { id: 2, name: 'Milk', categoryId: 2, category: 'Food', price: 2.5, quantity: 50 }
    ])
  }
  if (!read('users')) {
    write('users', [
      { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'Admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' }
    ])
  }
}

function nextId(list) {
  if (!list || list.length === 0) return 1
  return Math.max(...list.map(i => i.id)) + 1
}

export default {
  async getAll(resource) {
    ensureSeed()
    await sleep()
    return read(resource) || []
  },

  async get(resource, id) {
    ensureSeed()
    await sleep()
    const list = read(resource) || []
    return list.find(i => i.id === id) || null
  },

  async create(resource, payload) {
    ensureSeed()
    await sleep()
    const list = read(resource) || []
    const id = nextId(list)
    const item = { id, ...payload }
    list.push(item)
    write(resource, list)
    return item
  },

  async update(resource, id, payload) {
    ensureSeed()
    await sleep()
    const list = read(resource) || []
    const idx = list.findIndex(i => i.id === id)
    if (idx === -1) throw new Error('Not found')
    list[idx] = { ...list[idx], ...payload }
    write(resource, list)
    return list[idx]
  },

  async remove(resource, id) {
    ensureSeed()
    await sleep()
    const list = read(resource) || []
    const newList = list.filter(i => i.id !== id)
    write(resource, newList)
    return true
  },

  // helper to replace a relation on create/update (e.g. store product.category)
  async getBy(resource, field, value) {
    ensureSeed()
    await sleep()
    const list = read(resource) || []
    return list.filter(i => i[field] === value)
  }
}
