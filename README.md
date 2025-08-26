# AI Social Media Caption Generator

An AI-powered app that generates social media captions from images using GPT-4 Vision API.

## Features

- **Image Upload**: Drag and drop or click to upload images
- **AI Caption Generation**: Uses GPT-4 Vision to analyze images and create engaging captions
- **Custom Notes**: Add optional notes to guide the AI's caption generation
- **Multiple Variations**: Get 3 different caption options with hashtags
- **Copy to Clipboard**: Easy copying of generated captions

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

1. Go to [OpenAI Platform](https://platform.openai.com/) and get an API key
2. Copy `backend/.env.example` to `backend/.env`
3. Replace `your_openai_api_key_here` with your actual OpenAI API key:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```
Frontend will run on http://localhost:5173

### 4. Use the App

1. Open http://localhost:5173 in your browser
2. Upload an image (JPG, PNG, GIF up to 10MB)
3. Optionally add notes about the image
4. Click "Generate Captions"
5. Copy and use the generated captions!

## Project Structure

```
pawscribe/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── backend/               # Node.js Express server
│   ├── src/               # Backend source code
│   ├── uploads/           # Image upload directory
│   └── .env               # Environment variables
└── README.md
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI GPT-4 Vision API
- **File Upload**: Multer

## Costs

- Each image analysis costs approximately $0.01-0.17 depending on image size and complexity
- Consider setting usage limits in your OpenAI account for cost control

## Troubleshooting

**"OpenAI API key not configured" error:**
- Make sure you've added your API key to `backend/.env`
- Restart the backend server after adding the key

**Upload errors:**
- Check that images are under 10MB
- Supported formats: JPG, PNG, GIF

**Backend connection errors:**
- Make sure both frontend (5173) and backend (3001) servers are running
- Check that no other applications are using these ports
