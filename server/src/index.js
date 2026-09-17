
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NoteNest API is running',
  })
})

// GET all notes
app.get('/api/notes', async (req, res) => {
  try {
    const { search, subject, pinned } = req.query

    const notes = await prisma.note.findMany({
      where: {
        ...(subject && subject !== 'All'
          ? { subject }
          : {}),
        ...(pinned === 'true'
          ? { pinned: true }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  content: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  subject: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    res.json({
      success: true,
      data: notes,
    })
  } catch (error) {
    console.error('GET /api/notes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
    })
  }
})

// GET one note
app.get('/api/notes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID',
      })
    }

    const note = await prisma.note.findUnique({
      where: { id },
    })

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    res.json({
      success: true,
      data: note,
    })
  } catch (error) {
    console.error('GET /api/notes/:id error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
    })
  }
})

// CREATE a note
app.post('/api/notes', async (req, res) => {
  try {
    const {
      title,
      subject = 'General',
      content = '',
      tags = [],
      pinned = false,
    } = req.body

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      })
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        subject,
        content,
        tags: Array.isArray(tags) ? tags : [],
        pinned: Boolean(pinned),
      },
    })

    res.status(201).json({
      success: true,
      message: 'Note created',
      data: note,
    })
  } catch (error) {
    console.error('POST /api/notes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
    })
  }
})

// UPDATE a note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID',
      })
    }

    const {
      title,
      subject,
      content,
      tags,
      pinned,
    } = req.body

    const existingNote = await prisma.note.findUnique({
      where: { id },
    })

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined
          ? { title: title.trim() }
          : {}),
        ...(subject !== undefined
          ? { subject }
          : {}),
        ...(content !== undefined
          ? { content }
          : {}),
        ...(tags !== undefined
          ? { tags: Array.isArray(tags) ? tags : [] }
          : {}),
        ...(pinned !== undefined
          ? { pinned: Boolean(pinned) }
          : {}),
      },
    })

    res.json({
      success: true,
      message: 'Note updated',
      data: note,
    })
  } catch (error) {
    console.error('PUT /api/notes/:id error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
    })
  }
})

// DELETE a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID',
      })
    }

    const existingNote = await prisma.note.findUnique({
      where: { id },
    })

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    await prisma.note.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Note deleted',
    })
  } catch (error) {
    console.error('DELETE /api/notes/:id error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
    })
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