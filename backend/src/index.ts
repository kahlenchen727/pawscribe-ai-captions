import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { config } from 'dotenv'
import path from 'path'
import fs from 'fs'
import OpenAI from 'openai'

config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' })
    }

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// Caption generation endpoint
app.post('/api/generate-captions', async (req, res) => {
  try {
    console.log('Caption generation request received')
    console.log('Request has imageBase64:', !!req.body.imageBase64)
    console.log('ImageBase64 length:', req.body.imageBase64?.length || 0)
    
    const { imageBase64, userNotes, tone } = req.body

    if (!imageBase64) {
      console.error('No image base64 provided')
      return res.status(400).json({ error: 'Image base64 is required' })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    console.log('Using base64 image, size:', Math.round(imageBase64.length / 1024), 'KB')
    console.log('User notes length:', userNotes?.length || 0)

    // Create prompt for GPT-4 Vision
    const prompt = `Analyze this image and create 3 engaging social media captions.

${userNotes ? `User notes: ${userNotes}` : ''}
${tone ? `Desired tone: ${tone}` : 'Tone: engaging and social media friendly'}

For each caption:
1. Make it engaging and authentic
2. Include relevant emojis
3. Add 3-5 relevant hashtags
4. Keep it under 280 characters
5. Make each caption unique in style

Return the response as a JSON array of objects with 'caption' and 'hashtags' fields.`

    console.log('Calling OpenAI API with model: gpt-4o')
    console.log('Prompt preview:', prompt.substring(0, 100) + '...')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    })
    
    console.log('OpenAI API call successful')
    console.log('Response preview:', response.choices[0].message.content?.substring(0, 100))

    const aiResponse = response.choices[0].message.content

    // Try to parse JSON response, fallback to simple format if parsing fails
    let captions
    try {
      // First try to parse as JSON
      const parsed = JSON.parse(aiResponse || '[]')
      
      if (Array.isArray(parsed)) {
        captions = parsed
      } else {
        // If it's not an array, wrap it
        captions = [parsed]
      }
    } catch {
      // If parsing fails, try to extract JSON from the response text
      const jsonMatch = aiResponse?.match(/\[.*\]/s)
      if (jsonMatch) {
        try {
          captions = JSON.parse(jsonMatch[0])
        } catch {
          // Final fallback: create simple captions from the response
          captions = [
            { caption: aiResponse || "Great moments captured! ✨", hashtags: "#memories #photography #lifestyle" }
          ]
        }
      } else {
        // No JSON found, create fallback
        captions = [
          { caption: aiResponse || "Great moments captured! ✨", hashtags: "#memories #photography #lifestyle" }
        ]
      }
    }

    // Ensure each caption has the right format
    captions = captions.map((item: any) => {
      if (typeof item === 'string') {
        return { caption: item, hashtags: "" }
      }
      return {
        caption: item.caption || item.text || String(item),
        hashtags: item.hashtags || ""
      }
    })

    res.json({
      success: true,
      captions: captions
    })

  } catch (error) {
    console.error('Caption generation error:', error)
    res.status(500).json({ 
      error: 'Failed to generate captions',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' })
    }
  }
  
  console.error('Server error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`)
})