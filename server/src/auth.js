import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { requireAuth } from './middleware/authMiddleware.js'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function createAccessToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
  )
}

function createRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured')
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
  )
}

function setRefreshCookie(res, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production'
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  })
}

function clearRefreshCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production'
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  })
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

      const accessToken = createAccessToken(user)
      const refreshToken = createRefreshToken(user)
      setRefreshCookie(res, refreshToken)

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: publicUser(user),
          accessToken,
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

      const accessToken = createAccessToken(user)
      const refreshToken = createRefreshToken(user)
      setRefreshCookie(res, refreshToken)

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: publicUser(user),
          accessToken,
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

  router.post('/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required',
        })
      }

      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      let payload
      try {
        payload = jwt.verify(refreshToken, secret)
      } catch (err) {
        clearRefreshCookie(res)
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        })
      }

      if (!payload || !payload.userId) {
        clearRefreshCookie(res)
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token payload',
        })
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      })

      if (!user) {
        clearRefreshCookie(res)
        return res.status(401).json({
          success: false,
          message: 'User not found',
        })
      }

      const accessToken = createAccessToken(user)
      const newRefreshToken = createRefreshToken(user)
      setRefreshCookie(res, newRefreshToken)

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: publicUser(user),
          accessToken,
        },
      })
    } catch (error) {
      console.error('POST /api/auth/refresh error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
      })
    }
  })

  router.post('/logout', (req, res) => {
    clearRefreshCookie(res)
    return res.json({
      success: true,
      message: 'Logout successful',
    })
  })

  router.get('/me', requireAuth, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      return res.json({
        success: true,
        data: {
          user: publicUser(user),
        },
      })
    } catch (error) {
      console.error('GET /api/auth/me error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
      })
    }
  })

  return router
}
