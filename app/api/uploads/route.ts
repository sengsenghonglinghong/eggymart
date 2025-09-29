import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const files = form.getAll('files') as File[]
    console.log('Upload API - Number of files received:', files.length)
    console.log('Upload API - File names:', files.map(f => f.name))
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []
    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = (file.name?.split('.').pop() || 'bin').toLowerCase()
      const base = crypto.randomBytes(16).toString('hex')
      const filename = `${base}.${ext}`
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      const url = `/uploads/${filename}`
      urls.push(url)
      console.log('Uploaded file:', file.name, '->', url)
    }

    console.log('Upload API - Generated URLs:', urls)
    return NextResponse.json({ urls })
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}








