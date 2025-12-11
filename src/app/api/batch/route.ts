import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { processAncientText } from '@/lib/ai-processor'
import { batchReconstructGlyphs, needsReconstruction } from '@/lib/grm'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

/**
 * Batch processing endpoint for Rune-X
 * Processes multiple uploads in parallel or sequentially
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { uploadIds, options = {} } = body

    if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
      return NextResponse.json(
        { error: 'uploadIds array is required' },
        { status: 400 }
      )
    }

    const { 
      parallel = false, // Process in parallel or sequentially
      enableReconstruction = true, // Enable GRM for damaged glyphs
      maxConcurrent = 3 // Max concurrent processing when parallel=true
    } = options

    // Fetch all uploads
    const uploads = await db.upload.findMany({
      where: {
        id: { in: uploadIds },
        userId: session.user.id // Ensure user owns these uploads
      }
    })

    if (uploads.length === 0) {
      return NextResponse.json({ error: 'No valid uploads found' }, { status: 404 })
    }

    const results: Array<{
      uploadId: string
      status: 'success' | 'failed'
      error?: string
      glyphsProcessed?: number
      reconstructions?: number
    }> = []

    // Process uploads
    if (parallel) {
      // Process in batches to avoid overwhelming the system
      const batches: string[][] = []
      for (let i = 0; i < uploads.length; i += maxConcurrent) {
        batches.push(uploads.slice(i, i + maxConcurrent).map(u => u.id))
      }

      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(uploadId => processUpload(uploadId, enableReconstruction))
        )

        batchResults.forEach((result, index) => {
          const uploadId = batch[index]
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            results.push({
              uploadId,
              status: 'failed',
              error: result.reason?.message || 'Unknown error'
            })
          }
        })
      }
    } else {
      // Sequential processing
      for (const upload of uploads) {
        try {
          const result = await processUpload(upload.id, enableReconstruction)
          results.push(result)
        } catch (error: any) {
          results.push({
            uploadId: upload.id,
            status: 'failed',
            error: error.message || 'Processing failed'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    })
  } catch (error: any) {
    console.error('Batch processing error:', error)
    return NextResponse.json(
      { error: 'Batch processing failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Process a single upload with optional GRM reconstruction
 */
async function processUpload(
  uploadId: string,
  enableReconstruction: boolean
): Promise<{
  uploadId: string
  status: 'success' | 'failed'
  error?: string
  glyphsProcessed?: number
  reconstructions?: number
}> {
  const upload = await db.upload.findUnique({
    where: { id: uploadId },
    include: {
      glyphs: {
        include: {
          glyph: true
        }
      }
    }
  })

  if (!upload) {
    throw new Error('Upload not found')
  }

  if (upload.status === 'COMPLETED') {
    // Already processed, check if reconstruction is needed
    if (enableReconstruction) {
      const candidates = upload.glyphs.filter(g => 
        needsReconstruction({
          symbol: g.glyph.symbol,
          confidence: g.confidence,
          boundingBox: g.boundingBox ? JSON.parse(g.boundingBox) : undefined
        })
      )

      if (candidates.length > 0) {
        // Perform reconstruction
        const reconstructionResults = await batchReconstructGlyphs(
          upload.filePath,
          candidates.map(g => ({
            boundingBox: g.boundingBox ? JSON.parse(g.boundingBox) : { x: 0, y: 0, width: 0, height: 0 },
            symbol: g.glyph.symbol,
            confidence: g.confidence
          })),
          {
            scriptType: upload.scriptType || undefined
          }
        )

        // Create reconstruction version
        const versionNumber = await db.reconstructionVersion.count({
          where: { uploadId: upload.id }
        }) + 1

        await db.reconstructionVersion.create({
          data: {
            uploadId: upload.id,
            versionNumber,
            reconstructedGlyphs: JSON.stringify(reconstructionResults),
            confidence: reconstructionResults.reduce((sum, r) => sum + r.confidence, 0) / reconstructionResults.length,
            method: 'gemini-grm'
          }
        })

        return {
          uploadId,
          status: 'success',
          glyphsProcessed: upload.glyphs.length,
          reconstructions: reconstructionResults.length
        }
      }
    }

    return {
      uploadId,
      status: 'success',
      glyphsProcessed: upload.glyphs.length,
      reconstructions: 0
    }
  }

  // Process the upload
  await db.upload.update({
    where: { id: uploadId },
    data: { status: 'PROCESSING' }
  })

  try {
    const result = await processAncientText(upload.filePath, db)

    // Update upload with results
    await db.upload.update({
      where: { id: uploadId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        scriptType: result.scriptType
      }
    })

    // Save glyphs
    let glyphsProcessed = 0
    for (const glyph of result.glyphs) {
      // Find or create glyph in database
      let dbGlyph = await db.glyph.findFirst({
        where: { symbol: glyph.symbol }
      })

      if (!dbGlyph) {
        // Create glyph if it doesn't exist
        const script = await db.ancientScript.findFirst({
          where: { name: result.scriptType || 'Unknown' }
        }) || await db.ancientScript.create({
          data: { name: result.scriptType || 'Unknown' }
        })

        dbGlyph = await db.glyph.create({
          data: {
            scriptId: script.id,
            symbol: glyph.symbol,
            description: glyph.meaning,
            confidence: glyph.confidence
          }
        })
      }

      await db.glyphMatch.create({
        data: {
          uploadId: upload.id,
          glyphId: dbGlyph.id,
          confidence: glyph.confidence,
          boundingBox: JSON.stringify(glyph.position),
          position: glyphsProcessed
        }
      })

      glyphsProcessed++
    }

    // Save translation
    if (result.translation) {
      await db.translation.create({
        data: {
          uploadId: upload.id,
          originalText: result.extractedText,
          translatedText: result.translation,
          confidence: result.confidence,
          language: 'English'
        })
      })
    }

    // Perform reconstruction if enabled
    let reconstructions = 0
    if (enableReconstruction) {
      const candidates = result.glyphs.filter(g => 
        needsReconstruction({
          symbol: g.symbol,
          confidence: g.confidence,
          boundingBox: g.position
        })
      )

      if (candidates.length > 0) {
        const reconstructionResults = await batchReconstructGlyphs(
          upload.filePath,
          candidates.map(g => ({
            boundingBox: g.position,
            symbol: g.symbol,
            confidence: g.confidence
          })),
          {
            scriptType: result.scriptType
          }
        )

        await db.reconstructionVersion.create({
          data: {
            uploadId: upload.id,
            versionNumber: 1,
            reconstructedGlyphs: JSON.stringify(reconstructionResults),
            confidence: reconstructionResults.reduce((sum, r) => sum + r.confidence, 0) / reconstructionResults.length,
            method: 'gemini-grm'
          }
        })

        reconstructions = reconstructionResults.length
      }
    }

    return {
      uploadId,
      status: 'success',
      glyphsProcessed,
      reconstructions
    }
  } catch (error: any) {
    await db.upload.update({
      where: { id: uploadId },
      data: { status: 'FAILED' }
    })
    throw error
  }
}
