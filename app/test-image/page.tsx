'use client'

import { useState, useEffect } from 'react'

export default function TestImagePage() {
  const [imageUrl, setImageUrl] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Test the specific image that's not working
    const testImagePath = '/uploads/ratings/2_1758400787357_9fl172txu7o.jpg'
    const baseUrl = window.location.origin
    
    setImageUrl(`${baseUrl}${testImagePath}`)
    setApiUrl(`${baseUrl}/api/images${testImagePath}`)
    setLoading(false)
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Image Test Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Direct Public Path:</h2>
        <p className="text-sm text-gray-600">URL: {imageUrl}</p>
        <div className="border p-4">
          <img 
            src={imageUrl} 
            alt="Test image - direct path"
            className="max-w-xs h-auto"
            onLoad={() => console.log('Direct path image loaded successfully')}
            onError={(e) => {
              console.log('Direct path image failed to load:', e.currentTarget.src)
              console.log('Error details:', e)
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">API Route Path:</h2>
        <p className="text-sm text-gray-600">URL: {apiUrl}</p>
        <div className="border p-4">
          <img 
            src={apiUrl} 
            alt="Test image - API route"
            className="max-w-xs h-auto"
            onLoad={() => console.log('API route image loaded successfully')}
            onError={(e) => {
              console.log('API route image failed to load:', e.currentTarget.src)
              console.log('Error details:', e)
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Direct Public Path (Root):</h2>
        <p className="text-sm text-gray-600">URL: {typeof window !== 'undefined' ? window.location.origin + '/test-image.jpg' : ''}</p>
        <div className="border p-4">
          <img 
            src="/test-image.jpg" 
            alt="Test image - direct public"
            className="max-w-xs h-auto"
            onLoad={() => console.log('Direct public image loaded successfully')}
            onError={(e) => {
              console.log('Direct public image failed to load:', e.currentTarget.src)
              console.log('Error details:', e)
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Test API Endpoints:</h2>
        <div className="space-x-2">
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/test-image')
                const data = await response.json()
                console.log('Test API response:', data)
                alert(JSON.stringify(data, null, 2))
              } catch (error) {
                console.error('Test API error:', error)
                alert('Test API failed: ' + error)
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Image API
          </button>
          
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/debug-path')
                const data = await response.json()
                console.log('Debug path response:', data)
                alert(JSON.stringify(data, null, 2))
              } catch (error) {
                console.error('Debug path error:', error)
                alert('Debug path failed: ' + error)
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Debug Path
          </button>
        </div>
      </div>
    </div>
  )
}
