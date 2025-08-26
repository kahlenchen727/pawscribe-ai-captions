import { useState } from 'react'
import type { Caption } from '../types'

interface CaptionDisplayProps {
  captions: Caption[]
}

export default function CaptionDisplay({ captions }: CaptionDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (caption: Caption, index: number) => {
    try {
      const textToCopy = `${caption.caption}\n\n${caption.hashtags}`
      await navigator.clipboard.writeText(textToCopy)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy caption:', err)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Generated Captions
      </h2>
      <div className="space-y-4">
        {captions.map((captionObj, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="space-y-2">
              <p className="text-gray-800">{captionObj.caption}</p>
              <p className="text-blue-600 text-sm font-medium">{captionObj.hashtags}</p>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => handleCopy(captionObj, index)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  copiedIndex === index
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                } border`}
              >
                {copiedIndex === index ? 'Copied!' : 'Copy All'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> These captions are AI-generated. Feel free to edit them 
          to match your personal style and brand voice before posting!
        </p>
      </div>
    </div>
  )
}