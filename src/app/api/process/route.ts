import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processAncientText, generateTranslation } from '@/lib/ai-processor'

export async function POST(request: NextRequest) {
  try {
    const { uploadId } = await request.json()

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 })
    }

    // Get upload record to find file path
    const upload = await db.upload.findUnique({
      where: { id: uploadId }
    })

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Update upload status to processing
    await db.upload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' }
    })

    // Clean up any previous AI results for this upload to avoid duplicates
    await db.glyphMatch.deleteMany({ where: { uploadId } })
    await db.translation.deleteMany({ where: { uploadId } })

    // Process the image using AI
    let processingResult
    try {
      processingResult = await processAncientText(upload.filePath, db)
    } catch (error: any) {
      console.error('AI processing error:', error)
      
      // Update upload status to failed
      await db.upload.update({
        where: { id: uploadId },
        data: { status: 'FAILED' }
      })

      return NextResponse.json(
        { 
          error: 'Failed to process image with AI',
          details: error.message || 'OCR extraction failed. Please ensure the image is clear and contains readable text.'
        },
        { status: 500 }
      )
    }

    // Get or create script record
    let scriptRecord = await db.ancientScript.findFirst({
      where: { name: processingResult.scriptType || 'Traditional Chinese' }
    })

    if (!scriptRecord) {
      scriptRecord = await db.ancientScript.create({
        data: {
          name: processingResult.scriptType || 'Traditional Chinese',
          description: `Detected script type: ${processingResult.scriptType}`,
          region: 'Unknown',
          timePeriod: 'Unknown'
        }
      })
    }

    // Create glyph records and matches
    const createdGlyphMatches: Array<{
      id: string
      uploadId: string
      glyphId: string
      confidence: number
      boundingBox: string | null
      position: number | null
      glyph: any
    }> = []
    for (const glyphMatch of processingResult.glyphs) {
      // Find or create glyph in database
      let glyphRecord = await db.glyph.findFirst({
        where: { 
          symbol: glyphMatch.symbol,
          scriptId: scriptRecord.id
        }
      })

      if (!glyphRecord) {
        // Create new glyph with the meaning from AI matching
        // Only store if we have a real meaning (not fallback)
        const description = (glyphMatch.meaning && 
                            !glyphMatch.meaning.includes('Character:') && 
                            !glyphMatch.meaning.includes('Unknown character') &&
                            !glyphMatch.meaning.includes('not available'))
          ? glyphMatch.meaning
          : null // Don't store placeholder meanings
        
        glyphRecord = await db.glyph.create({
          data: {
            scriptId: scriptRecord.id,
            symbol: glyphMatch.symbol,
            name: glyphMatch.symbol,
            description: description || `Character: ${glyphMatch.symbol}`, // Fallback only for DB constraint
            confidence: glyphMatch.confidence
          }
        })
      } else {
        // Update existing glyph if we have a better meaning
        // Update if: new meaning exists, is not a placeholder, and is better than current
        const hasValidMeaning = glyphMatch.meaning && 
                                !glyphMatch.meaning.includes('Unknown character') && 
                                !glyphMatch.meaning.includes('not available') &&
                                !glyphMatch.meaning.includes('Character:')
        
        const currentIsPlaceholder = !glyphRecord.description || 
                                      glyphRecord.description.includes('Character:') ||
                                      glyphRecord.description.includes('Unknown')
        
        if (hasValidMeaning && currentIsPlaceholder) {
          await db.glyph.update({
            where: { id: glyphRecord.id },
            data: {
              description: glyphMatch.meaning,
              confidence: Math.max(glyphRecord.confidence || 0, glyphMatch.confidence)
            }
          })
          glyphRecord.description = glyphMatch.meaning
        }
      }

      // Create glyph match
      const match = await db.glyphMatch.create({
        data: {
          uploadId,
          glyphId: glyphRecord.id,
          confidence: glyphMatch.confidence,
          boundingBox: glyphMatch.boundingBox 
            ? JSON.stringify(glyphMatch.boundingBox)
            : null,
          position: glyphMatch.position
        }
      })

      createdGlyphMatches.push({
        ...match,
        glyph: glyphRecord
      })
    }

    // Generate translation using AI
    const translationResult = await generateTranslation(
      processingResult.extractedText,
      processingResult.glyphs
    )

    // Create translation record (single translation per upload)
    const translation = await db.translation.create({
      data: {
        uploadId,
        originalText: processingResult.extractedText,
        translatedText: translationResult.translation,
        confidence: translationResult.confidence,
        language: 'English',
        context: `Processed using ${processingResult.method} method. Script type: ${processingResult.scriptType}`
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
      message: 'AI processing completed successfully',
      results: {
        extractedText: processingResult.extractedText,
        glyphs: processingResult.glyphs.map(g => ({
          symbol: g.symbol,
          meaning: g.meaning,
          confidence: g.confidence
        })),
        translation: translation.translatedText,
        confidence: translation.confidence,
        scriptType: processingResult.scriptType,
        method: processingResult.method
      }
    })

  } catch (error: any) {
    console.error('Processing error:', error)
    
    // Update upload status to failed
    try {
      const body = await request.json().catch(() => ({}))
      const uploadId = body.uploadId
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
      { 
        error: 'Failed to process image',
        details: error.message || 'An unexpected error occurred during processing'
      },
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