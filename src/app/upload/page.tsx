'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  FileImage, 
  Brain, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Download,
  Share,
  History
} from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  file: File
  preview: string
  id: string
}

interface ProcessingResult {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  glyphs?: Array<{
    symbol: string
    confidence: number
    position: { x: number; y: number; width: number; height: number }
    meaning?: string
  }>
  translation?: string
  confidence?: number
}

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/upload')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return

    setIsProcessing(true)
    
    // Initialize processing results
    const results: ProcessingResult[] = uploadedFiles.map(file => ({
      id: file.id,
      status: 'processing' as const,
      progress: 0
    }))

    setProcessingResults(results)

    try {
      // Process each file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        
        // Step 1: Upload file
        const formData = new FormData()
        formData.append('file', file.file)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }
        
        const uploadData = await uploadResponse.json()
        
        // Step 2: Process the uploaded file
        const processResponse = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uploadId: uploadData.uploadId })
        })
        
        if (!processResponse.ok) {
          throw new Error('Processing failed')
        }
        
        const processData = await processResponse.json()
        
        // Step 3: Get detailed results
        const resultsResponse = await fetch(`/api/process?uploadId=${uploadData.uploadId}`)
        const resultsData = await resultsResponse.json()
        
        // Update progress to complete
        setProcessingResults(prev => 
          prev.map(r => 
            r.id === file.id 
              ? {
                  ...r,
                  status: 'completed',
                  progress: 100,
                  glyphs: resultsData.upload?.glyphs?.map((g: any) => ({
                    symbol: g.glyph.symbol,
                    confidence: g.confidence,
                    position: JSON.parse(g.boundingBox || '{}'),
                    meaning: g.glyph.description
                  })) || [],
                  translation: resultsData.upload?.translations?.[0]?.translatedText || '',
                  confidence: resultsData.upload?.translations?.[0]?.confidence || 0.90
                }
              : r
          )
        )
      }
    } catch (error) {
      console.error('Processing error:', error)
      // Mark all as failed
      setProcessingResults(prev => 
        prev.map(r => ({
          ...r,
          status: 'failed',
          progress: 0
        }))
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Project Decypher</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Upload Ancient Texts for Analysis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload images of ancient manuscripts, inscriptions, or seals for AI-powered 
              glyph recognition and semantic translation.
            </p>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Upload Area */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Images
                    </CardTitle>
                    <CardDescription>
                      Click to select files or drag and drop
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center">
                      <FileImage className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">
                        Click to upload images
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports JPG, PNG, WebP, TIFF up to 10MB
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select Files
                        </label>
                      </Button>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                        <div className="space-y-2">
                          {uploadedFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={file.preview}
                                  alt={file.file.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-sm">{file.file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={processFiles}
                          disabled={isProcessing || uploadedFiles.length === 0}
                        >
                          {isProcessing ? 'Processing...' : 'Process Files'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Guidelines for Best Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Clear Images</h4>
                        <p className="text-sm text-muted-foreground">
                          Use high-resolution images with good lighting and minimal blur
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Single Script Focus</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload images containing one type of ancient script per file
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Minimal Background Noise</h4>
                        <p className="text-sm text-muted-foreground">
                          Ensure the text is clearly visible without excessive background elements
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Supported Scripts</h4>
                        <p className="text-sm text-muted-foreground">
                          Oracle Bone Script, Bronze Script, Seal Script, Traditional Chinese, 
                          Classical Latin, Ancient Greek
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="processing" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Processing Status
                  </CardTitle>
                  <CardDescription>
                    Watch as our AI analyzes your ancient texts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {processingResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Eye className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No files are currently being processed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {processingResults.map((result) => {
                        const file = uploadedFiles.find(f => f.id === result.id)
                        return (
                          <div key={result.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {file && (
                                  <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{file?.file.name}</p>
                                  <Badge variant={
                                    result.status === 'completed' ? 'default' :
                                    result.status === 'processing' ? 'secondary' : 'destructive'
                                  }>
                                    {result.status}
                                  </Badge>
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {result.progress}%
                              </span>
                            </div>
                            <Progress value={result.progress} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="mt-8">
              <div className="space-y-8">
                {processingResults
                  .filter(result => result.status === 'completed')
                  .map((result) => {
                    const file = uploadedFiles.find(f => f.id === result.id)
                    return (
                      <Card key={result.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              Analysis Results
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </Button>
                              <Button variant="outline" size="sm">
                                <Share className="mr-2 h-4 w-4" />
                                Share
                              </Button>
                            </div>
                          </div>
                          <CardDescription>
                            {file?.file.name} • Confidence: {(result.confidence! * 100).toFixed(1)}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Original Image */}
                          <div>
                            <h4 className="font-medium mb-3">Original Image</h4>
                            {file && (
                              <img
                                src={file.preview}
                                alt={file.file.name}
                                className="w-full max-w-md mx-auto rounded-lg border"
                              />
                            )}
                          </div>

                          {/* Detected Glyphs */}
                          <div>
                            <h4 className="font-medium mb-3">Detected Glyphs</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {result.glyphs?.map((glyph, index) => (
                                <div key={index} className="text-center p-4 border rounded-lg">
                                  <div className="text-2xl mb-2">{glyph.symbol}</div>
                                  <div className="text-sm font-medium">{glyph.meaning}</div>
                                  <div className="text-xs text-green-600">
                                    {(glyph.confidence * 100).toFixed(1)}% match
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Translation */}
                          <div>
                            <h4 className="font-medium mb-3">Translation & Context</h4>
                            <div className="bg-primary/10 p-4 rounded-lg">
                              <p className="font-medium mb-2">{result.translation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                
                {processingResults.filter(result => result.status === 'completed').length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Eye className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No completed results yet. Upload and process some files to see results here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}