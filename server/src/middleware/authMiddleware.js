import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    })
  }

  const token = authHeader.slice('Bearer '.length).trim()

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    if (!payload || typeof payload !== 'object' || !Number.isInteger(payload.userId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      })
    }

    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}
