import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the registry.json file
    const registryPath = path.join(process.cwd(), 'registry.json')
    
    if (!fs.existsSync(registryPath)) {
      return NextResponse.json(
        { error: 'Registry not found. Please run build-registry script.' },
        { status: 404 }
      )
    }
    
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
    
    return NextResponse.json(registryData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load registry' },
      { status: 500 }
    )
  }
}