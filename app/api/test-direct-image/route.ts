import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET() {
  try {
    const imagePath = 'uploads/ratings/2_1758400787357_9fl172txu7o.jpg'
    const fullPath = join(process.cwd(), 'public', imagePath)
    
    const debugInfo = {
      imagePath,
      fullPath,
      exists: existsSync(fullPath),
      cwd: process.cwd(),
      publicDir: join(process.cwd(), 'public'),
      uploadsDir: join(process.cwd(), 'public', 'uploads'),
      ratingsDir: join(process.cwd(), 'public', 'uploads', 'ratings'),
    }
    
    if (existsSync(fullPath)) {
      const fileBuffer = await readFile(fullPath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    } else {
      return NextResponse.json(debugInfo, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

