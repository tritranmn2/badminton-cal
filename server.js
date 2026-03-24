import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

// Kết nối MongoDB
const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()
const db = client.db('badminton')
const sessions = db.collection('sessions')
console.log('✅ Kết nối MongoDB thành công')

// ── API routes ──────────────────────────────────────────────

// Lấy tất cả sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const docs = await sessions.find({}).sort({ createdAt: -1 }).toArray()
    // Loại bỏ _id của MongoDB
    res.json(docs.map(({ _id, ...rest }) => rest))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Thêm 1 session
app.post('/api/sessions', async (req, res) => {
  try {
    const doc = { ...req.body, createdAt: req.body.createdAt || new Date().toISOString() }
    await sessions.insertOne(doc)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Xoá 1 session theo id (id của app, không phải _id MongoDB)
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await sessions.deleteOne({ id: req.params.id })
    res.json({ ok: true })
  } catch (err) {
    
    res.status(500).json({ error: err.message })
  }
})

// Cập nhật 1 session theo id
app.put('/api/sessions/:id', async (req, res) => {
  try {
    const id = req.params.id
    const doc = { ...req.body, id }
    const result = await sessions.updateOne(
      { id },
      { $set: doc },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Session không tồn tại' })
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Bulk insert (dùng khi import JSON)
app.post('/api/sessions/bulk', async (req, res) => {
  try {
    const docs = req.body.map((s) => ({
      ...s,
      createdAt: s.createdAt || new Date().toISOString(),
    }))
    if (docs.length) await sessions.insertMany(docs)
    res.json({ ok: true, inserted: docs.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Serve React build (production) ──────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))
app.get('/{*path}', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))

app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`))
