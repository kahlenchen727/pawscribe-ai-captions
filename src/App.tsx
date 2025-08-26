import { useState } from 'react'

interface ImageWithNotes {
  file: File
  preview: string
  notes: string
  id: string
}

function App() {
  const [selectedImages, setSelectedImages] = useState<ImageWithNotes[]>([])
  const [overallTone, setOverallTone] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English'])
  const [captions, setCaptions] = useState<{[key: string]: Array<{caption: string, hashtags: string}>}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableLanguages = [
    { code: 'English', name: 'English', flag: '🇺🇸' },
    { code: 'Traditional Chinese', name: '繁體中文', flag: '🇹🇼' },
    { code: 'Japanese', name: '日本語', flag: '🇯🇵' },
    { code: 'Korean', name: '한국어', flag: '🇰🇷' },
    { code: 'Spanish', name: 'Español', flag: '🇪🇸' },
    { code: 'French', name: 'Français', flag: '🇫🇷' },
  ]

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(lang => lang !== language)
        : [...prev, language]
    )
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage: ImageWithNotes = {
          file,
          preview: event.target?.result as string,
          notes: '',
          id: Date.now() + Math.random().toString()
        }
        setSelectedImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
    
    setCaptions({})
    setError(null)
    // Clear the input so same files can be selected again
    e.target.value = ''
  }

  const updateImageNotes = (id: string, notes: string) => {
    setSelectedImages(prev => 
      prev.map(img => img.id === id ? { ...img, notes } : img)
    )
  }

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id))
  }

  const handleGenerateCaptions = async () => {
    if (selectedImages.length === 0 || selectedLanguages.length === 0) return

    setIsLoading(true)
    setError(null)
    
    try {
      const newCaptions: {[key: string]: Array<{caption: string, hashtags: string}>} = {}
      
      // Process each language separately
      for (const language of selectedLanguages) {
        // For now, we'll use the first image and combine all image notes
        const firstImage = selectedImages[0]
        
        // Convert image to base64 instead of uploading to server
        console.log('Converting image to base64 for language:', language)
        const reader = new FileReader()
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(firstImage.file)
        })
        
        console.log('Image converted to base64, length:', imageBase64.length)
        
        // Combine all image notes
        const allImageNotes = selectedImages
          .map((img, index) => img.notes ? `Image ${index + 1}: ${img.notes}` : '')
          .filter(note => note)
          .join('. ')
        
        // Create language-specific prompt
        const languagePrompt = `Generate 3 engaging social media captions in ${language} language.
        
Context:
- Total images in post: ${selectedImages.length}
- Image descriptions: ${allImageNotes || 'No specific descriptions provided'}
- Overall tone: ${overallTone || 'engaging and social media friendly'}

Requirements:
- Write ONLY in ${language} language${language === 'Traditional Chinese' ? ' (use Traditional Chinese characters 繁體中文, NOT Simplified Chinese 简体中文)' : ''}
- Make captions suitable for Instagram/social media
- Include relevant hashtags in ${language}${language === 'Traditional Chinese' ? ' (hashtags must also use Traditional Chinese characters)' : ''}
- Keep each caption under 280 characters
- Make them engaging and authentic

Return the response as a JSON array of objects with 'caption' and 'hashtags' fields.`

        // Generate captions using GPT-4 Vision
        console.log('Generating captions for language:', language)
        console.log('Sending prompt:', languagePrompt.substring(0, 100) + '...')
        
        const captionResponse = await fetch('https://pawscribe-api-869751453118.us-central1.run.app/api/generate-captions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: imageBase64,
            userNotes: languagePrompt,
            tone: `${language} language${language === 'Traditional Chinese' ? ' (Traditional Chinese characters only, no Simplified Chinese)' : ''}, ${overallTone || 'engaging'}`
          }),
        })
        
        console.log('Caption response status:', captionResponse.status)
        if (!captionResponse.ok) {
          const errorText = await captionResponse.text()
          console.error('Caption generation failed:', errorText)
          throw new Error(`Failed to generate captions for ${language}: ${errorText}`)
        }
        
        const captionData = await captionResponse.json()
        console.log('Caption data received:', captionData)
        
        // Process the response - backend now returns properly formatted captions
        if (captionData.captions && Array.isArray(captionData.captions)) {
          newCaptions[language] = captionData.captions.map((item: any) => ({
            caption: item.caption || String(item),
            hashtags: item.hashtags || ''
          }))
        } else {
          // Fallback: treat the whole response as a single caption
          newCaptions[language] = [{
            caption: `Generated caption in ${language}`,
            hashtags: '#socialmedia #ai'
          }]
        }
      }
      
      setCaptions(newCaptions)
    } catch (error) {
      console.error('Error generating captions:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate captions. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
          AI Caption Generator
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Upload multiple images and get AI-powered social media captions for your post
        </p>
        
        {/* Image Upload */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images for Your Post
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="block w-full text-sm text-gray-500 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500">You can select multiple images at once</p>
        </div>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Images ({selectedImages.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedImages.map((image) => (
                <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="relative mb-3">
                    <img
                      src={image.preview}
                      alt="Selected"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Describe this image... (optional)"
                    value={image.notes}
                    onChange={(e) => updateImageNotes(image.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Language Selection */}
        {selectedImages.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Languages for Captions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => toggleLanguage(language.code)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg transition-all ${
                    selectedLanguages.includes(language.code)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="font-medium">{language.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Select one or more languages for your captions</p>
          </div>
        )}

        {/* Overall Tone */}
        {selectedImages.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Tone for Your Post (optional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Excited, Grateful, Inspirational, Fun, Professional..."
              value={overallTone}
              onChange={(e) => setOverallTone(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">This helps AI understand the mood you want for your captions</p>
          </div>
        )}

        {/* Generate Button */}
        {selectedImages.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6 text-center">
            <button 
              onClick={handleGenerateCaptions}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-md transition duration-200 text-lg"
            >
              {isLoading ? 'Analyzing Images & Generating Captions...' : `Generate Captions for ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {Object.keys(captions).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Generated Captions in {selectedLanguages.length} Language{selectedLanguages.length > 1 ? 's' : ''}
            </h2>
            
            {selectedLanguages.map((language) => (
              <div key={language} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">
                    {availableLanguages.find(lang => lang.code === language)?.flag}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {availableLanguages.find(lang => lang.code === language)?.name} Captions
                  </h3>
                </div>
                
                <div className="space-y-3 pl-8">
                  {captions[language]?.map((captionItem, index) => {
                    const fullText = typeof captionItem === 'string' 
                      ? captionItem 
                      : `${captionItem.caption}${captionItem.hashtags ? '\n\n' + captionItem.hashtags : ''}`
                    
                    return (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="mb-3">
                          {typeof captionItem === 'string' ? (
                            <p className="text-gray-800 leading-relaxed whitespace-pre-line">{captionItem}</p>
                          ) : (
                            <>
                              <p className="text-gray-800 leading-relaxed mb-2">{captionItem.caption}</p>
                              {captionItem.hashtags && (
                                <p className="text-blue-600 text-sm font-medium">{captionItem.hashtags}</p>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(fullText)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded-md transition-colors"
                        >
                          Copy {availableLanguages.find(lang => lang.code === language)?.name}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> These captions are AI-generated in multiple languages. Feel free to edit them to match your personal style and cultural context!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
