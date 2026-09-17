import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const TOKEN_EXPIRES_IN = '7d'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  )
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export default function createAuthRouter(prisma) {
  const router = express.Router()

  router.post('/register', async (req, res) => {
    try {
      const name = String(req.body.name || '').trim()
      const email = normalizeEmail(req.body.email)
      const password = String(req.body.password || '')

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required',
        })
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already registered',
        })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })

      const token = createToken(user)

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: publicUser(user),
          token,
        },
      })
    } catch (error) {
      console.error('POST /api/auth/register error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to register user',
      })
    }
  })

  router.post('/login', async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email)
      const password = String(req.body.password || '')

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        })
      }

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        })
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash)

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        })
      }

      const token = createToken(user)

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: publicUser(user),
          token,
        },
      })
    } catch (error) {
      console.error('POST /api/auth/login error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to log in',
      })
    }
  })

  return router
}
