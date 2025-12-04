import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock ancient glyph data for simulation
const mockGlyphs = [
  { symbol: '道', meaning: 'Tao - The way/path', confidence: 0.95 },
  { symbol: '法', meaning: 'Fa - Law/method', confidence: 0.88 },
  { symbol: '自', meaning: 'Zi - Self/natural', confidence: 0.92 },
  { symbol: '然', meaning: 'Ran - Thus/naturally', confidence: 0.85 },
  { symbol: '人', meaning: 'Ren - Person/human', confidence: 0.90 },
  { symbol: '天', meaning: 'Tian - Heaven/sky', confidence: 0.93 },
  { symbol: '地', meaning: 'Di - Earth/ground', confidence: 0.87 },
  { symbol: '德', meaning: 'De - Virtue/morality', confidence: 0.89 }
]

const mockTranslations = {
  '道法自然': 'The Tao follows nature - A fundamental concept in Taoist philosophy suggesting that the natural way of things is the best way.',
  '天人合一': 'Heaven and humanity are one - The unity between the cosmos and human existence.',
  '道德经': 'Tao Te Ching - The fundamental text of Taoism attributed to Laozi.',
  '仁义礼智': 'Benevolence, righteousness, propriety, and wisdom - The four cardinal virtues in Confucianism.'
}

export async function POST(request: NextRequest) {
  try {
    const { uploadId } = await request.json()

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 })
    }

    // Update upload status to processing
    await db.upload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' }
    })

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate mock glyph matches
    const numGlyphs = Math.floor(Math.random() * 4) + 2 // 2-5 glyphs
    const selectedGlyphs = mockGlyphs.sort(() => 0.5 - Math.random()).slice(0, numGlyphs)
    
    // Create glyph matches
    for (let i = 0; i < selectedGlyphs.length; i++) {
      const glyph = selectedGlyphs[i]
      
      // Find or create the glyph in database
      let glyphRecord = await db.glyph.findFirst({
        where: { symbol: glyph.symbol }
      })

      if (!glyphRecord) {
        // Create a mock ancient script record
        let scriptRecord = await db.ancientScript.findFirst({
          where: { name: 'Traditional Chinese' }
        })

        if (!scriptRecord) {
          scriptRecord = await db.ancientScript.create({
            data: {
              name: 'Traditional Chinese',
              description: 'Traditional Chinese characters used in ancient texts',
              region: 'China',
              timePeriod: '2000 BCE - Present'
            }
          })
        }

        glyphRecord = await db.glyph.create({
          data: {
            scriptId: scriptRecord.id,
            symbol: glyph.symbol,
            name: glyph.symbol,
            description: glyph.meaning,
            confidence: glyph.confidence
          }
        })
      }

      // Create glyph match
      await db.glyphMatch.create({
        data: {
          uploadId,
          glyphId: glyphRecord.id,
          confidence: glyph.confidence,
          boundingBox: JSON.stringify({
            x: i * 60 + 10,
            y: 20,
            width: 50,
            height: 50
          }),
          position: i
        }
      })
    }

    // Generate mock translation
    const originalText = selectedGlyphs.map(g => g.symbol).join('')
    const translation = mockTranslations[originalText as keyof typeof mockTranslations] || 
      `Translation of "${originalText}" - This ancient text contains profound wisdom about life, nature, and spiritual cultivation.`

    // Create translation record
    await db.translation.create({
      data: {
        uploadId,
        originalText,
        translatedText: translation,
        confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
        language: 'English'
      }
    })

    // Update upload status to completed
    await db.upload.update({
      where: { id: uploadId },
      data: { 
        status: 'COMPLETED',
        processedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Processing completed successfully',
      results: {
        glyphs: selectedGlyphs,
        translation,
        confidence: 0.90
      }
    })

  } catch (error) {
    console.error('Processing error:', error)
    
    // Update upload status to failed
    try {
      const { uploadId } = await request.json()
      if (uploadId) {
        await db.upload.update({
          where: { id: uploadId },
          data: { status: 'FAILED' }
        })
      }
    } catch (updateError) {
      console.error('Failed to update status:', updateError)
    }

    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('uploadId')

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 })
    }

    // Get upload with related data
    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      include: {
        glyphs: {
          include: {
            glyph: true
          }
        },
        translations: true
      }
    })

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      upload
    })

  } catch (error) {
    console.error('Get processing status error:', error)
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    )
  }
}