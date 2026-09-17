import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import createAuthRouter from './auth.js'
import { requireAuth } from './middleware/authMiddleware.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))
app.use('/api/auth', createAuthRouter(prisma))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NoteNest API is running',
  })
})

// ─── Notes CRUD ───────────────────────────────────────────────────────────────

// GET all notes (authenticated user only)
app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const { search, subject, pinned, tag } = req.query

    const notes = await prisma.note.findMany({
      where: {
        userId: req.user.userId,
        ...(subject && subject !== 'All' ? { subject } : {}),
        ...(pinned === 'true' ? { pinned: true } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(search
          ? {
              OR: [
                { title:   { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    res.json({ success: true, data: notes })
  } catch (error) {
    console.error('GET /api/notes error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch notes' })
  }
})

// GET one note (must belong to authenticated user)
app.get('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid note ID' })
    }

    const note = await prisma.note.findFirst({
      where: { id, userId: req.user.userId },
    })

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    res.json({ success: true, data: note })
  } catch (error) {
    console.error('GET /api/notes/:id error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch note' })
  }
})

// CREATE a note (userId always comes from JWT, never from body)
app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const {
      title,
      subject = 'General',
      content = '',
      tags = [],
      pinned = false,
    } = req.body

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' })
    }

    const note = await prisma.note.create({
      data: {
        userId: req.user.userId,          // always from JWT
        title: String(title).trim(),
        subject: String(subject || 'General'),
        content: String(content || ''),
        tags: Array.isArray(tags) ? tags.map(String) : [],
        pinned: Boolean(pinned),
      },
    })

    res.status(201).json({ success: true, message: 'Note created', data: note })
  } catch (error) {
    console.error('POST /api/notes error:', error)
    res.status(500).json({ success: false, message: 'Failed to create note' })
  }
})

// UPDATE a note (must belong to authenticated user, cannot change owner)
app.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid note ID' })
    }

    const { title, subject, content, tags, pinned } = req.body

    // Verify ownership before touching the record
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: req.user.userId },
    })

    if (!existingNote) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    const updateData = {}
    if (title !== undefined)   updateData.title   = String(title).trim()
    if (subject !== undefined)  updateData.subject  = String(subject)
    if (content !== undefined)  updateData.content  = String(content)
    if (tags !== undefined)     updateData.tags     = Array.isArray(tags) ? tags.map(String) : []
    if (pinned !== undefined)   updateData.pinned   = Boolean(pinned)

    const note = await prisma.note.update({
      where: { id },          // safe: ownership already verified above
      data: updateData,
    })

    res.json({ success: true, message: 'Note updated', data: note })
  } catch (error) {
    console.error('PUT /api/notes/:id error:', error)
    res.status(500).json({ success: false, message: 'Failed to update note' })
  }
})

// DELETE a note (must belong to authenticated user)
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid note ID' })
    }

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: req.user.userId },
    })

    if (!existingNote) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    await prisma.note.delete({ where: { id } })

    res.json({ success: true, message: 'Note deleted' })
  } catch (error) {
    console.error('DELETE /api/notes/:id error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete note' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`NoteNest API running at http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
