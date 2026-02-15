import { createClerkClient } from '@clerk/clerk-sdk-node'

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
})

// Middleware to verify Clerk session
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      })
    }

    const token = authHeader.split(' ')[1]

    // Verify the session token with Clerk
    const session = await clerkClient.verifyToken(token)
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      })
    }

    // Attach user info to request
    req.userId = session.sub // Clerk user ID
    req.sessionId = session.sid

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    })
  }
}

// Optional: Middleware for webhook verification
export const verifyWebhook = async (req, res, next) => {
  try {
    const { Webhook } = await import('svix')
    
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET')
    }

    const wh = new Webhook(WEBHOOK_SECRET)
    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    }

    const payload = JSON.stringify(req.body)
    const evt = wh.verify(payload, headers)

    req.webhookEvent = evt
    next()
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return res.status(400).json({ 
      success: false, 
      message: 'Webhook verification failed' 
    })
  }
}

export default { requireAuth, verifyWebhook }