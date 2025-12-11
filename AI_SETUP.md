# AI Processing Setup Guide

This guide explains how to set up the AI-powered ancient glyph processing feature using free AI services.

## Overview

The AI processing system uses a **multi-tier fallback approach** to ensure maximum reliability:

1. **Google Gemini API** (Optional, most accurate) - Free tier available
2. **Hugging Face Inference API** (Free, no key required) - Primary free option
3. **Tesseract.js** (Free, local) - Always available fallback

## Free Options Available

### Option 1: Hugging Face (Recommended - No Setup Required)

**Status**: ✅ **FREE - No API key needed for basic usage**

Hugging Face provides free OCR models that work out of the box:
- Model: `microsoft/trocr-base-handwritten` (handwritten text recognition)
- Rate limits: ~30 requests/minute without API key
- Higher limits: Get free API key from [Hugging Face](https://huggingface.co/settings/tokens)

**Setup**: No setup required! Works immediately.

**Optional Enhancement**: 
1. Create free account at [huggingface.co](https://huggingface.co)
2. Generate API token at [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Add to `.env`: `HUGGINGFACE_API_KEY=your_token_here`

### Option 2: Tesseract.js (Client-Side Only)

**Status**: ⚠️ **Not available in server-side API routes**

**Note**: Tesseract.js uses Web Workers which don't work in Next.js API routes. It's included in the dependencies but won't be used for server-side processing. If you need local OCR, consider:
- Using client-side processing (browser-based)
- Using an alternative like `node-tesseract-ocr` (different package)
- Relying on Hugging Face and Gemini (recommended)

### Option 3: Google Gemini API (Optional - Best Accuracy)

**Status**: ✅ **FREE tier available**

Google Gemini offers the most accurate OCR and translation:
- Free tier: 60 requests/minute
- Best accuracy for ancient Chinese characters
- Includes AI-powered translation

**Setup**:
1. Get free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`: `GOOGLE_GEMINI_API_KEY=your_api_key_here`

## Environment Variables

Create or update your `.env` file:

```env
# Required
DATABASE_URL="file:./prisma/db/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional - For enhanced AI processing
GOOGLE_GEMINI_API_KEY="your_gemini_api_key_here"  # Optional: Best accuracy
HUGGINGFACE_API_KEY="your_hf_token_here"          # Optional: Higher rate limits
```

## Installation

1. **Install dependencies**:
```bash
npm install
```

This will install:
- `tesseract.js` - Local OCR engine
- `@google/generative-ai` - Google Gemini API client

2. **No additional setup needed!** The system will automatically:
   - Try Gemini first (if API key is set)
   - Fall back to Hugging Face (free, no key needed)
   - Note: Tesseract.js is not used in server-side processing (Web Workers limitation)

## How It Works

### Processing Flow

```
1. User uploads image
   ↓
2. Try Google Gemini (if API key configured)
   ↓ (if fails)
3. Try Hugging Face OCR (free, no key needed)
   - Tries multiple OCR models automatically
   - Handles model loading delays
   ↓ (if fails)
4. Return error with helpful message
   ↓
5. Match extracted text to glyphs in database
   ↓
6. Generate translation (Gemini if available, else fallback)
   ↓
7. Save results to database
```

### OCR Methods Comparison

| Method | Accuracy | Speed | Setup | Cost | Server-Side |
|--------|----------|-------|-------|------|-------------|
| Google Gemini | ⭐⭐⭐⭐⭐ | Fast | API Key | Free tier | ✅ Yes |
| Hugging Face | ⭐⭐⭐⭐ | Medium | None | Free | ✅ Yes |
| Tesseract.js | ⭐⭐⭐ | Slow | None | Free | ❌ No (Web Workers) |

## Testing

1. **Start the development server**:
```bash
npm run dev
```

2. **Upload an image** with ancient Chinese text at `/upload`

3. **Check the processing method** in the results - it will show which AI service was used

## Troubleshooting

### "All OCR methods failed"

**Possible causes**:
- Image is too blurry or low quality
- Image doesn't contain readable text
- Network issues (for API-based methods)
- Hugging Face models may be temporarily unavailable
- API rate limits exceeded

**Solutions**:

1. **Check the console logs** - The system now provides detailed error messages showing which models were tried and why they failed

2. **Use Google Gemini API** (Recommended):
   - Get free API key: https://aistudio.google.com/app/apikey
   - Add to `.env`: `GOOGLE_GEMINI_API_KEY=your_key_here`
   - Gemini has the best OCR accuracy and reliability

3. **Image Quality**:
   - Use clear, high-resolution images (at least 300 DPI)
   - Ensure text is clearly visible and not rotated
   - Good lighting and contrast
   - Avoid blurry or compressed images

4. **Development Fallback** (for testing):
   - If you want to test the system even when OCR fails, add to `.env`:
     ```
     ENABLE_OCR_FALLBACK=true
     ```
   - This will use sample data to test the rest of the pipeline

5. **Check Network**:
   - Ensure your server has internet access
   - Check firewall settings
   - Try again after a few minutes (Hugging Face models may be loading)

### "Hugging Face model loading"

**Cause**: The Hugging Face model is cold-starting (first request)

**Solution**: 
- The system automatically waits and retries (up to 30 seconds)
- Check console logs for estimated loading time
- If models keep failing, consider using Google Gemini API instead (more reliable)

### Tesseract.js not working

**Cause**: Language data files missing

**Solution**: Tesseract.js will automatically download language data on first use. Ensure you have internet connection.

## Rate Limits

### Hugging Face (No API Key)
- ~30 requests/minute
- Model may need to load on first request (10-30 seconds)

### Hugging Face (With API Key)
- Higher rate limits
- Faster response times

### Google Gemini (Free Tier)
- 60 requests/minute
- 1,500 requests/day

### Tesseract.js
- Not used in server-side processing (Web Workers limitation)
- Would work client-side but not implemented in current architecture

## Cost

**Total Cost: $0.00** 🎉

All methods are free:
- Hugging Face: Free forever
- Tesseract.js: Free and open source
- Google Gemini: Free tier sufficient for development/testing

## Next Steps

1. **For best results**: Get a free Google Gemini API key
2. **For higher rate limits**: Get a free Hugging Face token
3. **For privacy**: Use Tesseract.js (local processing)

The system automatically uses the best available method!







