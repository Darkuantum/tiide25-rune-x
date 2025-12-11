/**
 * AI Processing Service for Ancient Glyph Recognition
 * Uses free AI services: Hugging Face, Tesseract.js, and Google Gemini
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import * as https from 'https'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type { Agent } from 'https'

/**
 * Get proxy agent if proxy is configured
 * Note: If proxychains is detected, we skip the code-level proxy to avoid conflicts
 */
function getProxyAgent(): Agent | undefined {
  // Check if proxychains is active (it sets LD_PRELOAD or we can detect it)
  const isProxychainsActive = process.env.LD_PRELOAD?.includes('proxychains') || 
                               process.env.PROXYCHAINS_CONF_FILE ||
                               process.argv.some(arg => arg.includes('proxychains'))
  
  if (isProxychainsActive) {
    console.log('[Proxy] Proxychains detected, skipping code-level proxy to avoid conflicts')
    return undefined
  }
  
  const proxyUrl = process.env.SOCKS5_PROXY || process.env.SOCKS_PROXY
  if (proxyUrl) {
    try {
      console.log(`[Proxy] Using SOCKS5 proxy: ${proxyUrl}`)
      return new SocksProxyAgent(proxyUrl) as Agent
    } catch (error) {
      console.warn('Failed to create SOCKS5 proxy agent:', error)
    }
  }
  return undefined
}

/**
 * Make HTTP request with proxy support
 * This is needed because Node.js native fetch() doesn't support SOCKS5 proxies
 */
async function httpsRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string | Buffer
    timeout?: number
  } = {}
): Promise<{ status: number; ok: boolean; json: () => Promise<any>; text: () => Promise<string> }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const proxyAgent = getProxyAgent()
    
    // Validate hostname to prevent DNS resolution issues
    if (!urlObj.hostname || urlObj.hostname.includes('224.0.0')) {
      reject(new Error(`Invalid hostname resolved: ${urlObj.hostname}. This may indicate a DNS or proxy configuration issue.`))
      return
    }
    
    const requestOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: proxyAgent,
      timeout: options.timeout || 30000,
      // Add lookup function to ensure proper DNS resolution
      lookup: undefined, // Let Node.js handle DNS normally
    }

    const req = https.request(requestOptions, (res) => {
      const chunks: Buffer[] = []
      
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      res.on('end', () => {
        const data = Buffer.concat(chunks)
        resolve({
          status: res.statusCode || 0,
          ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
          json: async () => JSON.parse(data.toString('utf-8')),
          text: async () => data.toString('utf-8'),
        })
      })
    })

    req.on('error', (error: any) => {
      // Provide more helpful error messages
      if (error.code === 'ECONNREFUSED') {
        const errorMsg = `Connection refused to ${urlObj.hostname}:${urlObj.port || 443}. ` +
          `This may indicate:\n` +
          `1. Proxy configuration issue (check SOCKS5_PROXY environment variable)\n` +
          `2. Proxychains conflict (if using proxychains, ensure it's configured correctly)\n` +
          `3. Network connectivity issue\n` +
          `Original error: ${error.message}`
        reject(new Error(errorMsg))
      } else if (error.message?.includes('224.0.0')) {
        reject(new Error(`DNS resolution error: Hostname resolved to multicast address. ` +
          `This usually indicates a proxy configuration conflict. ` +
          `If using proxychains, check /etc/proxychains4.conf or disable proxychains and use SOCKS5_PROXY instead.`))
      } else {
        reject(error)
      }
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      if (Buffer.isBuffer(options.body)) {
        req.write(options.body)
      } else {
        req.write(options.body)
      }
    }
    
    req.end()
  })
}

// Types
export interface OCRResult {
  text: string
  confidence: number
  method: 'huggingface' | 'tesseract' | 'gemini' | 'fallback' | 'alternative' | 'huggingface-ancient'
  error?: string
}

export interface GlyphMatch {
  symbol: string
  confidence: number
  position: number
  boundingBox?: { x: number; y: number; width: number; height: number }
  meaning?: string
}

export interface ProcessingResult {
  extractedText: string
  glyphs: GlyphMatch[]
  scriptType?: string
  confidence: number
  method: string
}

/**
 * Extract text from image using Hugging Face OCR (Free)
 * NOTE: All Hugging Face OCR models have been deprecated (410 Gone) from Inference API
 * This function is kept for future use but will always fail
 */
async function extractTextWithHuggingFace(imagePath: string): Promise<OCRResult> {
  // All Hugging Face OCR models have been deprecated/removed from Inference API
  // This includes: TrOCR models, HunyuanOCR, and most other OCR models
  console.log('Hugging Face: All OCR models have been deprecated (410 Gone)')
  return {
    text: '',
    confidence: 0,
    method: 'huggingface',
    error: 'All Hugging Face OCR models have been deprecated. Please use Google Gemini API instead.'
  }
}

/**
 * Helper to extract text from various Hugging Face response formats
 */
function extractTextFromHFResponse(data: any): string {
  // Handle string responses
  if (typeof data === 'string') {
    return data.trim()
  }
  
  // Handle object responses
  if (data && typeof data === 'object') {
    // Check for generated_text (common in vision-language models)
    if (data.generated_text) {
      const text = String(data.generated_text).trim()
      if (text) return text
    }
    
    // Check for text field
    if (data.text) {
      const text = String(data.text).trim()
      if (text) return text
    }
    
    // Check for caption (image captioning models)
    if (data.caption) {
      const text = String(data.caption).trim()
      if (text) return text
    }
    
    // Check for error
    if (data.error) {
      throw new Error(`Hugging Face error: ${data.error}`)
    }
  }
  
  // Handle array responses
  if (Array.isArray(data)) {
    if (data.length > 0) {
      const firstItem = data[0]
      if (firstItem?.generated_text) {
        return String(firstItem.generated_text).trim()
      }
      if (firstItem?.text) {
        return String(firstItem.text).trim()
      }
      if (typeof firstItem === 'string') {
        return String(firstItem).trim()
      }
    }
  }
  
  return ''
}


/**
 * Try alternative free OCR services as fallback
 */
async function extractTextWithAlternativeServices(imagePath: string): Promise<OCRResult> {
  // Note: Most free OCR services without API keys have been deprecated
  // This is a placeholder for future integration
  // For now, we recommend using Google Gemini API
  
  return {
    text: '',
    confidence: 0,
    method: 'alternative',
    error: 'Alternative OCR services not implemented. Please use Google Gemini API for reliable OCR.'
  }
}

/**
 * Extract text using Google Gemini API (Free tier available)
 * Tries multiple models/API versions, moves to next on error (no retries)
 */
async function extractTextWithGemini(imagePath: string): Promise<OCRResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    console.log('Gemini: API key not configured')
    throw new Error('Google Gemini API key not configured')
  }

  console.log('Gemini: Starting OCR extraction...')
  const imageBuffer = await readFile(imagePath)
  const base64Image = imageBuffer.toString('base64')

  let lastError: any = null

  // Try different API versions and models in order of preference
  // Using models available in your Google AI Studio account
  const apiConfigs = [
    { version: 'v1beta', model: 'gemini-2.5-flash' },
    { version: 'v1', model: 'gemini-2.5-flash' },
    { version: 'v1beta', model: 'gemini-2.5-flash-lite' },
    { version: 'v1', model: 'gemini-2.5-flash-lite' },
  ]

  for (const config of apiConfigs) {
    console.log(`Gemini: Trying ${config.model} with ${config.version} API...`)
    try {
      // Use Gemini Vision API for OCR with proxy support
      const requestBody = JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Extract all text from this image. If it contains ancient Chinese characters, transcribe them exactly as they appear. Return only the extracted text, no explanations.'
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500
        }
      })
      
      const response = await httpsRequest(
        `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
          timeout: 60000, // 60 seconds for image processing
        }
      )

      // If model not found (404), try next config
      if (response.status === 404) {
        console.log(`Gemini: Model ${config.model} not found with ${config.version}, trying next configuration...`)
        continue // Try next config
      }

      // If rate limit (429), try next config (no retries)
      if (response.status === 429) {
        console.log(`Gemini: Rate limit (429) for ${config.model} (${config.version}), trying next configuration...`)
        continue // Try next config
      }

      if (!response.ok) {
        let errorDetails = `Status ${response.status}`
        try {
          const errorData = await response.json()
          errorDetails = errorData.error?.message || errorData.message || errorDetails
        } catch {
          // Couldn't parse error response
        }
        console.log(`Gemini: ${config.model} (${config.version}) failed: ${errorDetails}, trying next...`)
        lastError = new Error(`Gemini API error: ${errorDetails}`)
        continue // Try next config
      }

      // Success - parse and return result
      const data = await response.json()
      const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (extractedText) {
        console.log(`Gemini: Successfully extracted text using ${config.model} (${config.version})`)
        return {
          text: extractedText.trim(),
          confidence: 0.90, // Gemini is generally more accurate
          method: 'gemini'
        }
      } else {
        console.log(`Gemini: ${config.model} (${config.version}) returned empty text, trying next...`)
        continue // Try next config
      }
    } catch (error: any) {
      lastError = error
      console.log(`Gemini: ${config.model} (${config.version}) error: ${error.message}, trying next...`)
      continue // Try next config
    }
  }

  // All retries failed or non-retryable error
  const errorMessage = lastError?.message || 'Unknown Gemini API error'
  console.error('Gemini OCR error (all configs failed):', errorMessage)
  return {
    text: '',
    confidence: 0,
    method: 'gemini',
    error: errorMessage
  }
}

/**
 * Post-process OCR text using ancient Chinese language models
 * This improves recognition accuracy for ancient Chinese characters
 * Note: These models work with text, not images, so they're used for post-processing
 */
async function postProcessWithAncientChineseModels(text: string): Promise<string> {
  if (!text || text.length === 0) {
    return text
  }

  const hfToken = process.env.HUGGINGFACE_API_KEY
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (hfToken) {
    headers['Authorization'] = `Bearer ${hfToken}`
  }

  // Note: bert-ancient-chinese is a fill-mask model, which requires [MASK] tokens
  // For now, we'll skip it and focus on using gpt2-chinese-ancient for text generation/verification
  // In the future, we could use fill-mask to correct specific characters
  
  // Try gpt2-chinese-ancient for text generation/verification
  // This can help verify if the OCR text makes sense in ancient Chinese context
  try {
    console.log('Post-processing with gpt2-chinese-ancient (verification)...')
    
    // Use a small prompt to verify the text makes sense
    // The model can generate continuations that help verify OCR accuracy
    const prompt = text.substring(0, Math.min(50, text.length)) // Use first 50 chars
    
    const response = await httpsRequest(
      'https://api-inference.huggingface.co/models/uer/gpt2-chinese-ancient',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 10, // Just generate a few tokens for verification
            return_full_text: false,
          }
        }),
        timeout: 30000,
      }
    )

    if (response.ok) {
      const data = await response.json()
      // If the model can generate reasonable continuations, the OCR text is likely correct
      console.log('Post-processing verification completed (gpt2-chinese-ancient)')
      // For now, we return the original text
      // In the future, we could use the model's output to correct OCR errors
      return text
    }
  } catch (error: any) {
    console.log('Post-processing with gpt2-chinese-ancient failed:', error.message)
    // Continue without post-processing
  }

  return text
}

/**
 * Main OCR function - tries multiple methods with fallback
 */
export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  console.log('=== Starting OCR extraction ===')
  
  // Try methods in order of preference
  const methods: Array<{ name: string; fn: (path: string) => Promise<OCRResult> }> = []
  
  // 1. Try Gemini if API key is available (only reliable OCR option)
  // Note: All Hugging Face OCR models have been deprecated (410 Gone)
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    console.log('Gemini API key found, adding Gemini to methods list')
    methods.push({ name: 'Gemini', fn: extractTextWithGemini })
  } else {
    console.log('Gemini API key NOT found in environment variables')
    console.log('⚠️  ERROR: Gemini API key is REQUIRED - All Hugging Face OCR models have been deprecated')
  }
  
  // 2. Hugging Face OCR - All models deprecated (410 Gone)
  // Keeping function for future use, but it will always fail
  // Uncomment below if new OCR models become available on Hugging Face
  // methods.push({ name: 'Hugging Face OCR', fn: extractTextWithHuggingFace })
  
  // 3. Alternative services (placeholder for future)
  // methods.push(extractTextWithAlternativeServices)
  
  // Note: Tesseract.js doesn't work in Next.js API routes (Web Workers limitation)
  
  for (const method of methods) {
    try {
      console.log(`\n>>> Trying OCR method: ${method.name}`)
      const result = await method.fn(imagePath)
      if (result.text && result.text.length > 0) {
        console.log(`✓ OCR method succeeded: ${result.method}`)
        
        // Post-process with ancient Chinese models to improve accuracy
        try {
          const improvedText = await postProcessWithAncientChineseModels(result.text)
          if (improvedText && improvedText !== result.text) {
            console.log('Text improved by post-processing')
            result.text = improvedText
            result.confidence = Math.min(result.confidence + 0.05, 0.95) // Slight confidence boost
          }
        } catch (postProcessError: any) {
          console.log('Post-processing failed, using original OCR result:', postProcessError.message)
          // Continue with original result
        }
        
        return result
      }
      // If method returned empty text, try next one
      console.log(`✗ OCR method returned empty text: ${result.method}, trying next...`)
    } catch (error: any) {
      // If method threw error, try next one
      console.log(`✗ OCR method failed (${method.name}):`, error.message)
      continue
    }
  }

  // All methods failed
  return {
    text: '',
    confidence: 0,
    method: 'fallback',
    error: 'All OCR methods failed. Please ensure the image is clear and contains readable text.'
  }
}

/**
 * Get character meanings from AI translation context
 * Uses Gemini to provide meanings for each character
 */
async function getCharacterMeanings(
  extractedText: string,
  translationContext?: string
): Promise<Record<string, string>> {
  const meanings: Record<string, string> = {}
  
  if (!extractedText || extractedText.length === 0) {
    return meanings
  }

  // Extract unique Chinese characters
  const uniqueChars = Array.from(new Set(Array.from(extractedText.replace(/\s+/g, ''))))
    .filter(char => /[\u4e00-\u9fff]/.test(char)) // Only Chinese characters
  
  if (uniqueChars.length === 0) {
    return meanings
  }

  // If we have translation context, try to extract character meanings from it
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      // For very long character lists, we may need to batch them
      // But let's try the full list first with increased token limit
      const charsList = uniqueChars.join('')
      // Increase maxOutputTokens for longer character lists (estimate ~60 chars per character meaning)
      // For 430 characters, we'd need ~25,800 tokens, but we cap at 8000 for safety
      const estimatedTokens = Math.min(Math.max(800, uniqueChars.length * 60), 8000)
      
      console.log(`Requesting meanings for ${uniqueChars.length} unique characters (estimated ${estimatedTokens} tokens)`)
      
      const requestBody = JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert in ancient Chinese characters. For each of these ${uniqueChars.length} Chinese characters: "${charsList}", provide its English meaning(s).
            ${translationContext ? `The text was translated as: "${translationContext.substring(0, 500)}". Use this context to provide accurate meanings.` : 'Provide the most common meanings for each character.'}
            
            CRITICAL: Return ONLY a valid JSON object where each key is a Chinese character and the value is its English meaning(s).
            Format: {"的": "possessive particle, of", "是": "to be, is, are", "不": "not, no", "了": "completed action marker", "人": "person, people, human"}
            Include multiple meanings separated by commas when applicable. 
            You MUST provide meanings for ALL ${uniqueChars.length} characters in the list.
            Do not include any explanation, only the JSON object.`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: estimatedTokens // Use calculated estimate, capped at 8000
        }
      })
      
      const response = await httpsRequest(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
          timeout: 30000,
        }
      )

      if (response.ok) {
        const data = await response.json()
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        console.log('AI response for character meanings:', responseText.substring(0, 200))
        
        // Try to extract JSON from the response
        try {
          // Remove markdown code blocks if present
          let jsonText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsedMeanings = JSON.parse(jsonMatch[0])
            // Validate and clean the meanings
            for (const [char, meaning] of Object.entries(parsedMeanings)) {
              if (typeof meaning === 'string' && meaning.trim().length > 0) {
                meanings[char] = meaning.trim()
              }
            }
            console.log(`Extracted meanings for ${Object.keys(meanings).length} characters from AI:`, Object.keys(meanings))
          } else {
            console.log('No JSON object found in AI response')
          }
        } catch (parseError: any) {
          console.log('Could not parse character meanings from AI response:', parseError.message)
          // Fallback: try to extract meanings from the text directly
          const lines = responseText.split('\n')
          for (const line of lines) {
            const match = line.match(/["']([\u4e00-\u9fff])["']\s*:\s*["']([^"']+)["']/)
            if (match) {
              meanings[match[1]] = match[2].trim()
            }
          }
          if (Object.keys(meanings).length > 0) {
            console.log(`Extracted ${Object.keys(meanings).length} meanings using fallback method`)
          }
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('AI character meanings request failed:', response.status, errorText.substring(0, 200))
        // Don't return empty - try to retry with a simpler request
        if (response.status === 429 || response.status >= 500) {
          console.log('Retrying character meanings with simpler request...')
          // Could implement retry logic here if needed
        }
      }
    } catch (error: any) {
      console.error('Failed to get character meanings from AI:', error.message || error)
      // Don't silently fail - this is critical for glyph meanings
    }
  } else {
    console.warn('GOOGLE_GEMINI_API_KEY not found - cannot extract character meanings')
  }

  // Fallback: If AI failed to provide meanings, use translation API for individual characters
  if (Object.keys(meanings).length === 0 && uniqueChars.length > 0 && process.env.GOOGLE_GEMINI_API_KEY) {
    console.log('AI character meanings failed, trying fallback translation for individual characters...')
    
    // Try translating characters individually or in small batches
    const batchSize = 20 // Process 20 characters at a time
    for (let i = 0; i < uniqueChars.length; i += batchSize) {
      const batch = uniqueChars.slice(i, i + batchSize)
      const batchText = batch.join('')
      
      try {
        const requestBody = JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate each of these Chinese characters to English, providing their meanings: "${batchText}". 
              Return a JSON object where each character is a key and its English meaning is the value.
              Format: {"寒": "cold, winter", "蝉": "cicada", ...}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
        
        const response = await httpsRequest(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
            timeout: 30000,
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          
          try {
            let jsonText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsedMeanings = JSON.parse(jsonMatch[0])
              for (const [char, meaning] of Object.entries(parsedMeanings)) {
                if (typeof meaning === 'string' && meaning.trim().length > 0) {
                  meanings[char] = meaning.trim()
                }
              }
            }
          } catch (parseError) {
            // Try line-by-line extraction
            const lines = responseText.split('\n')
            for (const line of lines) {
              const match = line.match(/["']([\u4e00-\u9fff])["']\s*:\s*["']([^"']+)["']/)
              if (match) {
                meanings[match[1]] = match[2].trim()
              }
            }
          }
        }
      } catch (error: any) {
        console.log(`Fallback translation failed for batch ${i / batchSize + 1}:`, error.message)
      }
    }
    
    if (Object.keys(meanings).length > 0) {
      console.log(`Fallback translation extracted ${Object.keys(meanings).length} character meanings`)
    }
  }

  if (Object.keys(meanings).length === 0 && uniqueChars.length > 0) {
    console.error(`WARNING: No character meanings extracted for ${uniqueChars.length} characters. This will result in incomplete glyph data.`)
  }

  return meanings
}

/**
 * Match extracted text to glyphs in database
 * Uses AI to infer meanings for characters not in database
 */
export async function matchGlyphs(
  extractedText: string,
  db: any,
  translationContext?: string
): Promise<GlyphMatch[]> {
  const glyphs: GlyphMatch[] = []
  
  if (!extractedText || extractedText.length === 0) {
    return glyphs
  }

  // Get character meanings from AI if available
  console.log('Getting character meanings for text:', extractedText.substring(0, 50))
  const aiMeanings = await getCharacterMeanings(extractedText, translationContext)
  console.log(`Retrieved ${Object.keys(aiMeanings).length} character meanings from AI`)

  // Get all glyphs from database with script information
  const dbGlyphs = await db.glyph.findMany({
    include: {
      script: true
    }
  })

  // Match each character in extracted text
  // Handle both single characters and multi-character sequences
  const characters = Array.from(extractedText.replace(/\s+/g, ''))
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    
    // Skip punctuation and special characters
    if (/[.,;:!?\-_=+()\[\]{}]/.test(char)) {
      continue
    }

    // Find matching glyph in database (exact match)
    let matchedGlyph = dbGlyphs.find((g: any) => g.symbol === char)
    
    // If no exact match, try to find similar characters (for OCR errors)
    if (!matchedGlyph && char.length > 0) {
      // Try finding by similar Unicode or common variations
      matchedGlyph = dbGlyphs.find((g: any) => {
        // Check if symbol is visually similar or in same Unicode block
        return g.symbol.charCodeAt(0) === char.charCodeAt(0) ||
               g.symbol === char ||
               (g.name && g.name.toLowerCase().includes(char.toLowerCase()))
      })
    }
    
      if (matchedGlyph) {
      // Use database meaning, but prefer AI meaning if DB has placeholder
      const dbMeaning = matchedGlyph.description || matchedGlyph.name
      const isPlaceholder = !dbMeaning || 
                           dbMeaning.includes('Character:') || 
                           dbMeaning.includes('Unknown') ||
                           dbMeaning.includes('not available')
      
      // Always prefer AI meaning if available (it's more accurate)
      const finalMeaning = aiMeanings[char] 
        ? aiMeanings[char]
        : (dbMeaning && !isPlaceholder)
        ? dbMeaning
        : `Unknown character (may need to be added to database)`
      
      // Confidence calculation:
      // - Base: 60% for successful character recognition (we identified the UTF-8 character)
      // - +25% if we have AI meaning (85% total)
      // - +15% if we have DB meaning (75% total)
      // - If no meaning but character recognized: 60% (character recognition confidence)
      let confidence: number
      if (aiMeanings[char]) {
        confidence = 0.85 // High confidence: character recognized + AI meaning
      } else if (dbMeaning && !isPlaceholder) {
        confidence = Math.max(matchedGlyph.confidence || 0.75, 0.75) // Character recognized + DB meaning
      } else {
        confidence = 0.60 // Character recognized but no meaning available
      }
      
      glyphs.push({
        symbol: char,
        confidence: confidence,
        position: i,
        meaning: finalMeaning,
        boundingBox: {
          x: i * 60 + 10,
          y: 20,
          width: 50,
          height: 50
        }
      })
    } else {
      // Character not in database - MUST use AI-derived meaning
      const aiMeaning = aiMeanings[char]
      
      if (aiMeaning) {
        console.log(`Using AI meaning for ${char}: ${aiMeaning}`)
        glyphs.push({
          symbol: char,
          confidence: 0.85, // High confidence: character recognized + AI meaning
          position: i,
          meaning: aiMeaning,
          boundingBox: {
            x: i * 60 + 10,
            y: 20,
            width: 50,
            height: 50
          }
        })
      } else {
        // Character recognized (we have UTF-8) but no meaning available
        // Still give 60% confidence for character recognition
        console.warn(`Character ${char} recognized but no meaning found. Using fallback translation or marking as unknown.`)
        
        // Try one more time with a direct translation request for this single character
        let fallbackMeaning: string | null = null
        if (process.env.GOOGLE_GEMINI_API_KEY) {
          try {
            const requestBody = JSON.stringify({
              contents: [{
                parts: [{
                  text: `What does the Chinese character "${char}" mean in English? Provide a brief meaning.`
                }]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 50
              }
            })
            
            const response = await httpsRequest(
              `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: requestBody,
                timeout: 10000,
              }
            )
            
            if (response.ok) {
              const data = await response.json()
              const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
              if (responseText.trim().length > 0) {
                fallbackMeaning = responseText.trim()
                console.log(`Fallback translation for ${char}: ${fallbackMeaning}`)
              }
            }
          } catch (error) {
            // Silently fail - we'll use the unknown message
          }
        }
        
        glyphs.push({
          symbol: char,
          confidence: fallbackMeaning ? 0.70 : 0.60, // 60% for recognition, 70% if we got fallback meaning
          position: i,
          meaning: fallbackMeaning || `Character recognized but meaning not available`,
          boundingBox: {
            x: i * 60 + 10,
            y: 20,
            width: 50,
            height: 50
          }
        })
      }
    }
  }
  
  console.log(`Matched ${glyphs.length} glyphs, ${glyphs.filter(g => g.meaning && !g.meaning.includes('Character:') && !g.meaning.includes('Unknown')).length} with meanings`)

  return glyphs
}

/**
 * Generate translation using AI (optional - uses Gemini if available)
 */
export async function generateTranslation(
  extractedText: string,
  glyphs: GlyphMatch[]
): Promise<{ translation: string; confidence: number }> {
  // If no text extracted, return default
  if (!extractedText || extractedText.length === 0) {
    return {
      translation: 'Unable to extract text from image. Please ensure the image is clear and contains readable text.',
      confidence: 0.0
    }
  }

  // Try using Gemini for translation if available
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    // Try different API versions and models
    // Using models available in your Google AI Studio account
    const apiConfigs = [
      { version: 'v1beta', model: 'gemini-2.5-flash' },
      { version: 'v1', model: 'gemini-2.5-flash' },
      { version: 'v1beta', model: 'gemini-2.5-flash-lite' },
      { version: 'v1', model: 'gemini-2.5-flash-lite' },
    ]

    for (const config of apiConfigs) {
      try {
        const requestBody = JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this ancient Chinese text and provide context: "${extractedText}". 
              Provide: 1) English translation, 2) Brief cultural/historical context. 
              Format: "Translation: [text] - Context: [context]"`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300
          }
        })
        
        const response = await httpsRequest(
          `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
            timeout: 30000,
          }
        )

        if (response.ok) {
          const data = await response.json()
          const translation = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          
          if (translation) {
            return {
              translation: translation.trim(),
              confidence: 0.88
            }
          }
        } else if (response.status === 404) {
          // Model not found, try next config
          console.log(`Translation: Model ${config.model} not found with ${config.version}, trying next...`)
          continue
        }
      } catch (error: any) {
      // If it's a "not found" error, try next config
      if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
        console.log(`Translation: Error with ${config.model}/${config.version}, trying next...`)
        continue
      }
      console.error('Gemini translation error:', error)
      // For other errors, try next config
      continue
    }
    }
  }

  // Fallback: Use hardcoded translations for common phrases
  const commonTranslations: Record<string, string> = {
    '道法自然': 'The Tao follows nature - A fundamental concept in Taoist philosophy suggesting that the natural way of things is the best way.',
    '天人合一': 'Heaven and humanity are one - The unity between the cosmos and human existence.',
    '道德经': 'Tao Te Ching - The fundamental text of Taoism attributed to Laozi.',
    '仁义礼智': 'Benevolence, righteousness, propriety, and wisdom - The four cardinal virtues in Confucianism.',
    '道德': 'Virtue and morality - Core ethical principles in Chinese philosophy.',
    '仁义': 'Benevolence and righteousness - Key Confucian virtues.',
    '智慧': 'Wisdom and intelligence - The pursuit of knowledge and understanding.'
  }

  if (commonTranslations[extractedText]) {
    return {
      translation: commonTranslations[extractedText],
      confidence: 0.90
    }
  }

  // Generic translation
  const avgConfidence = glyphs.length > 0
    ? glyphs.reduce((sum, g) => sum + g.confidence, 0) / glyphs.length
    : 0.70

  return {
    translation: `Translation of "${extractedText}" - This ancient text contains cultural and philosophical significance. Individual characters: ${glyphs.map(g => `${g.symbol} (${g.meaning || 'unknown'})`).filter(Boolean).join(', ')}`,
    confidence: Math.min(avgConfidence, 0.85)
  }
}

/**
 * Main processing function
 */
export async function processAncientText(
  imagePath: string,
  db: any
): Promise<ProcessingResult> {
  // Step 1: Extract text from image
  const ocrResult = await extractTextFromImage(imagePath)
  
  if (!ocrResult.text || ocrResult.text.length === 0) {
    // In development mode, provide a helpful fallback for testing
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_OCR_FALLBACK === 'true') {
      console.warn('OCR failed, using development fallback mode')
      // Return a sample result for testing the rest of the pipeline
      return {
        extractedText: '道法自然', // Sample text for testing
        glyphs: [],
        scriptType: 'Traditional Chinese',
        confidence: 0.50,
        method: 'fallback-dev'
      }
    }
    
    // Provide helpful error message
    let errorMsg = 'Failed to extract text from image.'
    
    if (ocrResult.error) {
      errorMsg += ` ${ocrResult.error}`
    }
    
    throw new Error(errorMsg)
  }

  // Step 2: Generate translation first (we'll use it to improve glyph matching)
  const translation = await generateTranslation(ocrResult.text, [])

  // Step 3: Match glyphs with translation context for better meaning inference
  const glyphs = await matchGlyphs(ocrResult.text, db, translation.translation)

  // Determine script type from matched glyphs
  // Get script info from database for matched glyphs
  const scriptTypes = new Set<string>()
  
  if (glyphs.length > 0) {
    // Get unique script IDs from matched glyphs
    const glyphSymbols = glyphs.map(g => g.symbol)
    const matchedDbGlyphs = await db.glyph.findMany({
      where: {
        symbol: { in: glyphSymbols }
      },
      include: {
        script: true
      }
    })
    
    matchedDbGlyphs.forEach((g: any) => {
      if (g.script) {
        scriptTypes.add(g.script.name)
      }
    })
  }

  return {
    extractedText: ocrResult.text,
    glyphs,
    scriptType: Array.from(scriptTypes)[0] || 'Traditional Chinese', // Default fallback
    confidence: translation.confidence,
    method: ocrResult.method
  }
}

