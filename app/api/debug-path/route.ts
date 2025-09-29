import { NextResponse } from 'next/server'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'

export async function GET() {
  try {
    const testImagePath = 'ratings/2_1758400787357_9fl172txu7o.jpg'
    const fullPath = join(process.cwd(), 'public', 'uploads', testImagePath)
    
    const debugInfo = {
      testImagePath,
      fullPath,
      exists: existsSync(fullPath),
      cwd: process.cwd(),
      publicUploads: join(process.cwd(), 'public', 'uploads'),
      ratingsDir: join(process.cwd(), 'public', 'uploads', 'ratings'),
      ratingsExists: existsSync(join(process.cwd(), 'public', 'uploads', 'ratings')),
      filesInRatings: existsSync(join(process.cwd(), 'public', 'uploads', 'ratings')) 
        ? readdirSync(join(process.cwd(), 'public', 'uploads', 'ratings'))
        : 'Directory does not exist'
    }
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

