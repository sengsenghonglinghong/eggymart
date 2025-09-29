import { NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const testImagePath = join(process.cwd(), 'public', 'uploads', 'ratings', '2_1758400787357_9fl172txu7o.jpg')
    const exists = existsSync(testImagePath)
    
    return NextResponse.json({
      message: 'Image API test',
      testImagePath,
      exists,
      files: exists ? 'Image file exists' : 'Image file not found'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

