# Hugging Face OCR Models Deprecation

## Issue

All the TrOCR (Transformer-based OCR) models on Hugging Face Inference API have been **deprecated** and return **410 Gone** status codes:

- ❌ `microsoft/trocr-base-handwritten` - 410 Gone
- ❌ `microsoft/trocr-base-printed` - 410 Gone  
- ❌ `microsoft/trocr-small-handwritten` - 410 Gone
- ❌ `microsoft/trocr-small-printed` - 410 Gone

## Current Status

### What Works
- ✅ **Google Gemini API** - Working and reliable for OCR
- ✅ **Ancient Chinese text models** (post-processing):
  - `Jihuai/bert-ancient-chinese` - Available via Inference API
  - `uer/gpt2-chinese-ancient` - Available via Inference API

### What Doesn't Work
- ❌ Most Hugging Face OCR models - Deprecated (410 Gone)
- ❌ TrOCR models - All removed from Inference API

## Solution

### Recommended: Use Google Gemini

The best solution is to use **Google Gemini API** for OCR:

1. **Get a free API key**: https://aistudio.google.com/app/apikey
2. **Add to `.env`**:
   ```bash
   GOOGLE_GEMINI_API_KEY=your_key_here
   ```

3. **Gemini will be tried first** - Most reliable option

### Alternative: Try Tencent HunyuanOCR

The code now tries `tencent/HunyuanOCR` as a fallback, but it's unclear if it's available via Inference API. If it also returns 410, Hugging Face OCR will be skipped.

## Updated Processing Order

The system now tries methods in this order:

1. **Gemini** (if API key is set) - ✅ Recommended
2. **Hugging Face OCR** (fallback) - ⚠️ Most models deprecated
3. **Post-processing** with ancient Chinese models (if OCR succeeds)

## Why This Happened

Hugging Face has been deprecating many models from their free Inference API. This is likely due to:
- High costs of running inference
- Model maintenance overhead
- Shift to paid API tiers

## Recommendations

1. **Use Gemini API** - Most reliable option, free tier available
2. **Monitor Hugging Face** - New OCR models may become available
3. **Consider self-hosting** - If you need Hugging Face models, consider running them yourself

## References

- [Google Gemini API](https://aistudio.google.com/app/apikey)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
- [Tencent HunyuanOCR](https://huggingface.co/tencent/HunyuanOCR)


