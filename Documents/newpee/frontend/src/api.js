import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getDocuments = () => api.get('/documents').then(r => r.data)
export const deleteDocument = (id) => api.delete(`/documents/${id}`).then(r => r.data)

export const uploadFiles = (files) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}

export const runQuery = (question, wikipedia_mode = false) =>
  api.post('/query', { question, wikipedia_mode }).then(r => r.data)
