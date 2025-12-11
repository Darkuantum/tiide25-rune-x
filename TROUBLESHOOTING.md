# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "All Hugging Face OCR models failed"

This error means that all the free Hugging Face OCR models are either:
- Temporarily unavailable
- Loading (cold start)
- Not compatible with your image format
- Rate limited

#### Quick Fixes (in order of recommendation):

1. **Use Google Gemini API** (Best Solution)
   ```bash
   # Get free API key from: https://aistudio.google.com/app/apikey
   # Add to .env:
   GOOGLE_GEMINI_API_KEY=your_api_key_here
   ```
   - Most reliable OCR service
   - Free tier: 60 requests/minute
   - Best accuracy for ancient Chinese characters

2. **Check Your Image**
   - Is the image clear and high resolution?
   - Is the text clearly visible?
   - Try a different image to test

3. **Enable Development Fallback** (for testing only)
   ```bash
   # Add to .env:
   ENABLE_OCR_FALLBACK=true
   ```
   This allows you to test the rest of the system even when OCR fails.

4. **Wait and Retry**
   - Hugging Face models may be loading
   - Wait 1-2 minutes and try again
   - Check console logs for detailed error messages

5. **Get Hugging Face API Token** (for higher rate limits)
   ```bash
   # Get free token from: https://huggingface.co/settings/tokens
   # Add to .env:
   HUGGINGFACE_API_KEY=your_token_here
   ```

### Issue: "Failed to extract text from image"

This means OCR couldn't read any text from your image.

**Check:**
- Image quality (should be clear, not blurry)
- Text visibility (text should be clearly visible)
- Image format (JPG, PNG, WebP supported)
- File size (should be reasonable, not too large)

**Try:**
- Using a higher resolution image
- Ensuring good lighting/contrast in the image
- Using Google Gemini API for better OCR

### Issue: Module not found errors

If you see errors about missing modules:
```bash
npm install
```

This will install all required dependencies including:
- `tesseract.js`
- `@google/generative-ai`

### Issue: Hugging Face 410/404 errors

These mean the model endpoint doesn't exist or was removed.

**Solution**: The system automatically tries multiple models. If all fail, use Google Gemini API instead.

### Issue: Slow processing

**Normal behavior:**
- First Hugging Face request: 10-30 seconds (model loading)
- Subsequent requests: 2-5 seconds
- Google Gemini: 2-4 seconds typically

**To speed up:**
- Use Google Gemini API (faster and more reliable)
- Get Hugging Face API token (faster response times)

## Getting Help

1. **Check Console Logs**: The system now provides detailed error messages
2. **Check Network**: Ensure your server has internet access
3. **Try Google Gemini**: Most reliable option
4. **Image Quality**: Ensure your images are clear and readable

## Recommended Setup for Best Results

```env
# Required
DATABASE_URL="file:./prisma/db/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Recommended for best OCR
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"

# Optional for higher Hugging Face limits
HUGGINGFACE_API_KEY="your_hf_token"
```

## Testing Without OCR

If you want to test the system without OCR working:

```env
ENABLE_OCR_FALLBACK=true
```

This will use sample data to test glyph matching and translation features.







